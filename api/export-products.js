const Shopify = require('shopify-api-node');

module.exports = async (req, res) => {
  try {
    console.log('Iniciando exportação de produtos');
    
    // Verificar credenciais
    if (!process.env.SHOPIFY_SHOP_NAME || !process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_PASSWORD) {
      console.log('Credenciais não encontradas:', {
        shopName: process.env.SHOPIFY_SHOP_NAME ? 'presente' : 'ausente',
        apiKey: process.env.SHOPIFY_API_KEY ? 'presente' : 'ausente',
        password: process.env.SHOPIFY_PASSWORD ? 'presente' : 'ausente'
      });
      
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
    
    console.log('Conexão Shopify estabelecida');
    
    // Buscar produtos - método otimizado para performance
    let allProducts = [];
    let params = { limit: 250 }; // máximo permitido pela API
    
    // Primeira página
    const batch1 = await shopify.product.list(params);
    console.log(`Batch 1: ${batch1.length} produtos`);
    allProducts = allProducts.concat(batch1);
    
    // Segunda página
    if (batch1.length === 250 && batch1.nextPageParameters) {
      const batch2 = await shopify.product.list(batch1.nextPageParameters);
      console.log(`Batch 2: ${batch2.length} produtos`);
      allProducts = allProducts.concat(batch2);
      
      // Terceira página
      if (batch2.length === 250 && batch2.nextPageParameters) {
        const batch3 = await shopify.product.list(batch2.nextPageParameters);
        console.log(`Batch 3: ${batch3.length} produtos`);
        allProducts = allProducts.concat(batch3);
        
        // Quarta página
        if (batch3.length === 250 && batch3.nextPageParameters) {
          const batch4 = await shopify.product.list(batch3.nextPageParameters);
          console.log(`Batch 4: ${batch4.length} produtos`);
          allProducts = allProducts.concat(batch4);
          
          // Quinta página
          if (batch4.length === 250 && batch4.nextPageParameters) {
            const batch5 = await shopify.product.list(batch4.nextPageParameters);
            console.log(`Batch 5: ${batch5.length} produtos`);
            allProducts = allProducts.concat(batch5);
            
            // Sexta página
            if (batch5.length === 250 && batch5.nextPageParameters) {
              const batch6 = await shopify.product.list(batch5.nextPageParameters);
              console.log(`Batch 6: ${batch6.length} produtos`);
              allProducts = allProducts.concat(batch6);
              
              // Sétima página
              if (batch6.length === 250 && batch6.nextPageParameters) {
                const batch7 = await shopify.product.list(batch6.nextPageParameters);
                console.log(`Batch 7: ${batch7.length} produtos`);
                allProducts = allProducts.concat(batch7);
                
                // Oitava página
                if (batch7.length === 250 && batch7.nextPageParameters) {
                  const batch8 = await shopify.product.list(batch7.nextPageParameters);
                  console.log(`Batch 8: ${batch8.length} produtos`);
                  allProducts = allProducts.concat(batch8);
                  
                  // Nona página
                  if (batch8.length === 250 && batch8.nextPageParameters) {
                    const batch9 = await shopify.product.list(batch8.nextPageParameters);
                    console.log(`Batch 9: ${batch9.length} produtos`);
                    allProducts = allProducts.concat(batch9);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`Total de produtos obtidos: ${allProducts.length}`);
    
    // Processar produtos para CSV
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
