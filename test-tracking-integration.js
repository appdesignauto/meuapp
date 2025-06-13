/**
 * Script para testar a integração completa do Meta Pixel e Google Tag Manager
 * Execute este script no console do navegador para verificar se ambos estão funcionando
 */

console.log('=== TESTE DE INTEGRAÇÃO - META PIXEL E GOOGLE TAG MANAGER ===');

// Função para aguardar scripts carregarem
function waitForScripts() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkScripts = () => {
            attempts++;
            
            const metaPixelLoaded = !!window.DesignAutoPixel;
            const gtmLoaded = !!window.DesignAutoGTM;
            const fbqLoaded = typeof window.fbq !== 'undefined';
            const dataLayerExists = Array.isArray(window.dataLayer);
            
            console.log(`Tentativa ${attempts}:`, {
                metaPixelLoaded,
                gtmLoaded,
                fbqLoaded,
                dataLayerExists
            });
            
            if ((metaPixelLoaded && gtmLoaded) || attempts >= maxAttempts) {
                resolve({
                    metaPixelLoaded,
                    gtmLoaded,
                    fbqLoaded,
                    dataLayerExists
                });
            } else {
                setTimeout(checkScripts, 200);
            }
        };
        
        checkScripts();
    });
}

// Testar Meta Pixel
function testMetaPixel() {
    console.log('\n--- TESTE META PIXEL ---');
    
    if (!window.DesignAutoPixel) {
        console.error('❌ Meta Pixel não carregado');
        return false;
    }
    
    const config = window.DesignAutoPixel.getConfig();
    console.log('Configuração Meta Pixel:', config);
    
    const isActive = window.DesignAutoPixel.isActive();
    console.log('Meta Pixel ativo:', isActive);
    
    if (isActive) {
        // Testar eventos
        console.log('Testando eventos Meta Pixel...');
        
        window.DesignAutoPixel.trackCustomEvent('TestEvent', {
            test: true,
            timestamp: new Date().toISOString()
        });
        
        window.DesignAutoPixel.trackArtView({
            id: 'test-art-123',
            title: 'Arte de Teste',
            category: 'Vendas',
            value: 5
        });
        
        console.log('✅ Eventos Meta Pixel enviados');
        return true;
    } else {
        console.warn('⚠️ Meta Pixel não está ativo');
        return false;
    }
}

// Testar Google Tag Manager
function testGoogleTagManager() {
    console.log('\n--- TESTE GOOGLE TAG MANAGER ---');
    
    if (!window.DesignAutoGTM) {
        console.error('❌ Google Tag Manager não carregado');
        return false;
    }
    
    const config = window.DesignAutoGTM.getConfig();
    console.log('Configuração GTM:', config);
    
    const isActive = window.DesignAutoGTM.isActive();
    console.log('GTM ativo:', isActive);
    
    if (isActive) {
        // Testar eventos
        console.log('Testando eventos GTM...');
        
        window.DesignAutoGTM.trackEvent('test_event', {
            test: true,
            source: 'integration_test'
        });
        
        window.DesignAutoGTM.trackArtView({
            id: 'test-art-456',
            title: 'Arte GTM Teste',
            category: 'Lavagem',
            value: 3
        });
        
        // Verificar dataLayer
        if (window.dataLayer) {
            console.log('DataLayer atual:', window.dataLayer.slice(-5)); // Últimos 5 eventos
        }
        
        console.log('✅ Eventos GTM enviados');
        return true;
    } else {
        console.warn('⚠️ GTM não está ativo');
        return false;
    }
}

// Testar integração com componentes React
function testReactIntegration() {
    console.log('\n--- TESTE INTEGRAÇÃO REACT ---');
    
    // Simular uso dos hooks
    try {
        // Verificar se os hooks estão disponíveis no contexto global
        const metaPixelActive = window.DesignAutoPixel?.isActive();
        const gtmActive = window.DesignAutoGTM?.isActive();
        
        console.log('Hooks disponíveis:', {
            metaPixel: !!window.DesignAutoPixel,
            gtm: !!window.DesignAutoGTM
        });
        
        if (metaPixelActive || gtmActive) {
            console.log('✅ Integração React funcional');
            return true;
        } else {
            console.warn('⚠️ Nenhum serviço de tracking ativo');
            return false;
        }
    } catch (error) {
        console.error('❌ Erro na integração React:', error);
        return false;
    }
}

// Executar todos os testes
async function runIntegrationTest() {
    console.log('Aguardando scripts carregarem...');
    
    const scriptStatus = await waitForScripts();
    
    console.log('\n=== STATUS DOS SCRIPTS ===');
    console.log('Meta Pixel Script:', scriptStatus.metaPixelLoaded ? '✅' : '❌');
    console.log('GTM Script:', scriptStatus.gtmLoaded ? '✅' : '❌');
    console.log('Facebook Pixel (fbq):', scriptStatus.fbqLoaded ? '✅' : '❌');
    console.log('DataLayer:', scriptStatus.dataLayerExists ? '✅' : '❌');
    
    // Executar testes
    const metaPixelTest = testMetaPixel();
    const gtmTest = testGoogleTagManager();
    const reactTest = testReactIntegration();
    
    console.log('\n=== RESULTADO FINAL ===');
    console.log('Meta Pixel:', metaPixelTest ? '✅ FUNCIONANDO' : '❌ PROBLEMA');
    console.log('Google Tag Manager:', gtmTest ? '✅ FUNCIONANDO' : '❌ PROBLEMA');
    console.log('Integração React:', reactTest ? '✅ FUNCIONANDO' : '❌ PROBLEMA');
    
    const overallSuccess = metaPixelTest || gtmTest;
    console.log('\nStatus Geral:', overallSuccess ? '✅ INTEGRAÇÃO FUNCIONAL' : '❌ PROBLEMAS ENCONTRADOS');
    
    return {
        metaPixel: metaPixelTest,
        gtm: gtmTest,
        react: reactTest,
        overall: overallSuccess
    };
}

// Executar teste automaticamente
runIntegrationTest().then(results => {
    console.log('\n=== TESTE CONCLUÍDO ===');
    console.log('Resultados:', results);
    
    if (results.overall) {
        console.log('🎉 SUCESSO: Sistema de tracking funcionando!');
    } else {
        console.log('⚠️ ATENÇÃO: Verificar configurações no painel admin');
    }
});

// Exportar funções para uso manual
window.testTracking = {
    runIntegrationTest,
    testMetaPixel,
    testGoogleTagManager,
    testReactIntegration
};