// Script de força bruta para garantir footer no desktop
// Executa diretamente no servidor para forçar cache refresh

const express = require('express');
const fs = require('fs');
const path = require('path');

// Função para injetar CSS crítico diretamente no HTML
function injectCriticalFooterCSS() {
  const criticalCSS = `
    <style id="force-desktop-footer">
      @media screen and (min-width: 768px) {
        footer.designauto-footer {
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
        
        /* Backup footer que sempre aparece */
        body::after {
          content: "© DesignAuto 2025 - DESIGNAUTO.COM.BR LTDA";
          display: block !important;
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          background: white !important;
          border-top: 1px solid #e5e7eb !important;
          padding: 20px !important;
          text-align: center !important;
          font-size: 12px !important;
          color: #6b7280 !important;
          z-index: 10000 !important;
        }
        
        /* Layout container fixes */
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
    </style>
    
    <script>
      // JavaScript que força footer no desktop
      (function() {
        'use strict';
        
        function forceDesktopFooter() {
          if (window.innerWidth < 768) return;
          
          // Buscar todos os footers
          const footers = document.querySelectorAll('footer, .designauto-footer, [data-component="footer"]');
          
          footers.forEach(footer => {
            if (footer.tagName === 'FOOTER' || footer.classList.contains('designauto-footer')) {
              Object.assign(footer.style, {
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                position: 'relative',
                zIndex: '9999',
                backgroundColor: 'white',
                borderTop: '1px solid rgb(229, 231, 235)',
                width: '100%',
                minHeight: '250px',
                margin: '0',
                padding: '48px 16px',
                clear: 'both',
                transform: 'none',
                clip: 'auto',
                overflow: 'visible',
                boxSizing: 'border-box'
              });
            }
          });
          
          // Garantir layout container
          const rootLayout = document.getElementById('root-layout');
          if (rootLayout) {
            Object.assign(rootLayout.style, {
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'visible'
            });
          }
          
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            Object.assign(mainContent.style, {
              flex: '1 1 auto',
              overflow: 'visible'
            });
          }
        }
        
        // Executar imediatamente
        forceDesktopFooter();
        
        // Executar quando DOM estiver pronto
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', forceDesktopFooter);
        }
        
        // Executar quando página carregar completamente
        window.addEventListener('load', forceDesktopFooter);
        
        // Executar em resize
        window.addEventListener('resize', forceDesktopFooter);
        
        // Executar periodicamente
        setInterval(forceDesktopFooter, 3000);
        
        // Observer para mudanças no DOM
        const observer = new MutationObserver(function(mutations) {
          let shouldCheck = false;
          mutations.forEach(mutation => {
            if (mutation.type === 'childList' || 
                (mutation.type === 'attributes' && 
                 (mutation.attributeName === 'style' || mutation.attributeName === 'class'))) {
              shouldCheck = true;
            }
          });
          if (shouldCheck) {
            setTimeout(forceDesktopFooter, 100);
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
        
      })();
    </script>
  `;
  
  return criticalCSS;
}

// Função para adicionar ao HTML principal
function addToIndexHTML() {
  const indexPath = path.join(__dirname, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Verificar se já foi injetado
    if (!htmlContent.includes('force-desktop-footer')) {
      const criticalCSS = injectCriticalFooterCSS();
      
      // Injetar no head
      htmlContent = htmlContent.replace('</head>', criticalCSS + '</head>');
      
      // Salvar arquivo
      fs.writeFileSync(indexPath, htmlContent);
      console.log('✅ CSS crítico para footer desktop injetado no index.html');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addToIndexHTML();
}

module.exports = { injectCriticalFooterCSS, addToIndexHTML };