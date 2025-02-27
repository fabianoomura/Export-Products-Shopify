const Shopify = require('shopify-api-node');

module.exports = async (req, res) => {
  try {
    // Verificação detalhada das variáveis
    const vars = {
      shopName: process.env.SHOPIFY_SHOP_NAME,
      apiKey: process.env.SHOPIFY_API_KEY,
      password: process.env.SHOPIFY_PASSWORD
    };
    
    // Verificar valores um por um
    if (!vars.shopName) {
      return res.status(500).json({ 
        error: 'Configuração incompleta', 
        message: 'SHOPIFY_SHOP_NAME não está configurado',
        debug: vars
      });
    }
    
    if (!vars.apiKey) {
      return res.status(500).json({ 
        error: 'Configuração incompleta', 
        message: 'SHOPIFY_API_KEY não está configurado',
        debug: vars
      });
    }
    
    if (!vars.password) {
      return res.status(500).json({ 
        error: 'Configuração incompleta', 
        message: 'SHOPIFY_PASSWORD não está configurado',
        debug: vars
      });
    }
    
    // Se chegou aqui, todas as variáveis existem
    const shopify = new Shopify({
      shopName: vars.shopName,
      apiKey: vars.apiKey,
      password: vars.password,
      apiVersion: '2023-10'
    });
    
    // Tentar um comando simples
    try {
      const shopInfo = await shopify.shop.get();
      
      res.status(200).json({
        success: true,
        shop_info: {
          name: shopInfo.name,
          email: shopInfo.email,
          domain: shopInfo.domain
        },
        message: "Conexão Shopify bem-sucedida!"
      });
    } catch (shopError) {
      res.status(500).json({
        error: "Falha na API Shopify",
        message: shopError.message,
        stack: shopError.stack
      });
    }
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro geral', 
      message: error.message,
      stack: error.stack
    });
  }
};
