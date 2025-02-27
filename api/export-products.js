const Shopify = require('shopify-api-node');

module.exports = async (req, res) => {
  try {
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
    
    // Buscar produtos com otimização para execução mais rápida
    let allProducts = [];
    let params = { limit: 250 };
    let hasNextPage = true;
    
    // Primeira página (250 produtos)
    const firstBatch = await shopify.product.list(params);
    allProducts = allProducts.concat(firstBatch);
    
    // Segunda página (500 produtos)
    if (firstBatch.length === 250) {
      if (firstBatch.nextPageParameters) {
        const secondBatch = await shopify.product.list(firstBatch.nextPageParameters);
        allProducts = allProducts.concat(secondBatch);
        
        // Terceira página (750 produtos)
        if (secondBatch.length === 250 && secondBatch.nextPageParameters) {
          const thirdBatch = await shopify.product.list(secondBatch.nextPageParameters);
          allProducts = allProducts.concat(thirdBatch);
          
          // Quarta página (1000 produtos)
          if (thirdBatch.length === 250 && thirdBatch.nextPageParameters) {
            const fourthBatch = await shopify.product.list(thirdBatch.nextPageParameters);
            allProducts = allProducts.concat(fourthBatch);
            
            // Quinta página (1250 produtos)
            if (fourthBatch.length === 250 && fourthBatch.nextPageParameters) {
              const fifthBatch = await shopify.product.list(fourthBatch.nextPageParameters);
              allProducts = allProducts.concat(fifthBatch);
              
              // Sexta página (1500 produtos)
              if (fifthBatch.length === 250 && fifthBatch.nextPageParameters) {
                const sixthBatch = await shopify.product.list(fifthBatch.nextPageParameters);
                allProducts = allProducts.concat(sixthBatch);
                
                // Sétima página (1750 produtos)
                if (sixthBatch.length === 250 && sixthBatch.nextPageParameters) {
                  const seventhBatch = await shopify.product.list(sixthBatch.nextPageParameters);
                  allProducts = allProducts.concat(seventhBatch);
                  
                  // Oitava página (2000 produtos)
                  if (seventhBatch.length === 250 && seventhBatch.nextPageParameters) {
                    const eighthBatch = await shopify.product.list(seventhBatch.nextPageParameters);
                    allProducts = allProducts.concat(eighthBatch);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Processar produtos para CSV
    let csvData = [];
    for (const product of allProducts) {
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
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
    
    // Criar CSV
    let csvContent = 'ID,Variant_ID,SKU,Nome_do_Produto,Variação,Quantidade,Preço\n';
    csvData.forEach(item => {
      const safeProduct = item.product_name ? item.product_name.replace(/"/g, '""') : '';
      const safeVariant = item.variant_name ? item.variant_name.replace(/"/g, '""') : '';
      const safeSku = item.sku ? item.sku.replace(/"/g, '""') : '';
      
      csvContent += `${item.id},${item.variant_id},"${safeSku}","${safeProduct}","${safeVariant}",${item.inventory_quantity},${item.price}\n`;
    });
    
    // Enviar resposta
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=todos-produtos-shopify.csv');
    res.status(200).send(csvContent);
    
  } catch (error) {
    res.status(500).json({
      error: 'Falha ao exportar produtos',
      message: error.message
    });
  }
};
