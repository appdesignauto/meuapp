// Script para forçar footer no desktop - versão CommonJS
const fs = require('fs');
const path = require('path');

// Adicionar CSS crítico diretamente ao index.css
function addCriticalFooterCSS() {
  const indexCSSPath = path.join(__dirname, 'client/src/index.css');
  
  if (fs.existsSync(indexCSSPath)) {
    let cssContent = fs.readFileSync(indexCSSPath, 'utf8');
    
    const criticalCSS = `
/* FORÇA TOTAL DESKTOP FOOTER - SOLUÇÃO DEFINITIVA */
@media screen and (min-width: 768px) {
  footer.designauto-footer,
  footer[data-component="footer"],
  .footer-container,
  footer {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: relative !important;
    z-index: 9999 !important;
    background-color: white !important;
    border-top: 1px solid rgb(229, 231, 235) !important;
    width: 100% !important;
    min-height: 250px !important;
    margin: 0 !important;
    padding: 48px 16px !important;
    clear: both !important;
    transform: none !important;
    clip: auto !important;
    overflow: visible !important;
    box-sizing: border-box !important;
  }
  
  /* Backup footer fixo */
  body::before {
    content: "";
    display: block;
    height: 250px;
    width: 100%;
    background: transparent;
    position: relative;
    z-index: 1;
  }
  
  /* Layout garantido */
  #root-layout {
    min-height: 100vh !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: visible !important;
  }
  
  #main-content {
    flex: 1 1 auto !important;
    overflow: visible !important;
  }
}

/* CACHE BUSTER ${Date.now()} */
`;

    // Verificar se já existe
    if (!cssContent.includes('FORÇA TOTAL DESKTOP FOOTER')) {
      cssContent += criticalCSS;
      fs.writeFileSync(indexCSSPath, cssContent);
      console.log('✅ CSS crítico adicionado ao index.css');
    } else {
      console.log('ℹ️ CSS crítico já existe no index.css');
    }
  }
}

// Executar
addCriticalFooterCSS();