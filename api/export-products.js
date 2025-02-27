const Shopify = require('shopify-api-node');

module.exports = async (req, res) => {
  try {
    console.log('Iniciando exportação de produtos');
    
    // Verificar credenciais
    if (!process.env.SHOPIFY_SHOP_NAME || !process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_PASSWORD) {
      return res.status(500).json({
        error: 'Configuração incompleta',
        message: 'Credenciais do Shopify não configuradas'
      });
    }
    
    // Configurar Shopify
    const shopify = new Shopify({
      shopName: process.env.SHOPIFY_SHOP_NAME,
      apiKey: process.env.SHOPIFY_API_KEY,
      password: process.env.SHOPIFY_PASSWORD,
      apiVersion: '2023-10'
    });
    
    console.log('Buscando produtos...');
    // Buscar todos os produtos com paginação usando o método que funcionou anteriormente
    let allProducts = [];
    let params = { limit: 250 }; // máximo permitido pela API do Shopify
    let hasNextPage = true;
    let page = 1;
    
    while (hasNextPage) {
      console.log(`Buscando página ${page}...`);
      const productBatch = await shopify.product.list(params);
      console.log(`Recebidos ${productBatch.length} produtos`);
      
      allProducts = allProducts.concat(productBatch);
      console.log(`Total acumulado: ${allProducts.length} produtos`);
      
      // Verifica se há mais páginas
      if (productBatch.length < 250) {
        console.log('Última página alcançada (menos de 250 produtos)');
        hasNextPage = false;
      } else {
        // Configura para próxima página
        if (productBatch.nextPageParameters) {
          params = productBatch.nextPageParameters;
        } else {
          // Tenta usar o método de paginação por since_id como fallback
          const lastId = productBatch[productBatch.length - 1].id;
          params = { limit: 250, since_id: lastId };
        }
        page++;
      }
      
      // Proteção contra loops infinitos
      if (page > 50) {
        console.log('Limite de segurança de páginas atingido (50 páginas)');
        hasNextPage = false;
      }
    }
    
    console.log(`Busca concluída: ${allProducts.length} produtos obtidos no total`);
    
    // Processar produtos para CSV com todos os campos desejados
    console.log('Processando produtos para CSV...');
    let csvData = [];
    let variantCount = 0;
    
    for (const product of allProducts) {
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          variantCount++;
          csvData.push({
            id: product.id,
            variant_id: variant.id,
            sku: variant.sku || '',
            product_name: product.title,
            variant_name: variant.title !== 'Default Title' ? variant.title : '',
            inventory_quantity: variant.inventory_quantity || 0,
            price: variant.price || '0.00'
          });
        }
      }
    }
    
    console.log(`Processamento concluído: ${variantCount} variantes para o CSV`);
    
    // Criar CSV
    let csvContent = 'ID,Variant_ID,SKU,Nome_do_Produto,Variação,Quantidade,Preço\n';
    
    csvData.forEach(item => {
      // Garantir que campos de texto estão devidamente escapados
      const safeProduct = item.product_name ? item.product_name.replace(/"/g, '""') : '';
      const safeVariant = item.variant_name ? item.variant_name.replace(/"/g, '""') : '';
      const safeSku = item.sku ? item.sku.replace(/"/g, '""') : '';
      
      csvContent += `${item.id},${item.variant_id},"${safeSku}","${safeProduct}","${safeVariant}",${item.inventory_quantity},${item.price}\n`;
    });
    
    console.log('CSV gerado com sucesso, enviando resposta...');
    
    // Enviar resposta
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=todos-produtos-shopify.csv');
    res.status(200).send(csvContent);
    
  } catch (error) {
    console.error('Erro na exportação:', error);
    res.status(500).json({
      error: 'Falha ao exportar produtos',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
