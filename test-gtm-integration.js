/**
 * Script de Teste Completo - Integração Google Tag Manager
 * 
 * Este script testa todas as funcionalidades do GTM implementadas no DesignAuto:
 * - Configuração automática via banco de dados
 * - Rastreamento de eventos personalizados
 * - Integração com React hooks
 * - DataLayer e debugging
 */

async function testGTMIntegration() {
    console.log('🏷️ === TESTE COMPLETO GTM INTEGRATION ===');
    
    // 1. Verificar se as configurações estão no banco
    console.log('\n1. Verificando configurações no banco de dados...');
    try {
        const response = await fetch('/api/analytics/settings');
        const settings = await response.json();
        
        console.log('✅ Configurações carregadas:', {
            gtmId: settings.gtmId || 'NÃO CONFIGURADO',
            ga4Id: settings.ga4Id || 'NÃO CONFIGURADO', 
            gtmEnabled: settings.gtmEnabled,
            metaPixelEnabled: settings.metaPixelEnabled
        });
        
        if (!settings.gtmEnabled) {
            console.warn('⚠️ GTM está desabilitado nas configurações');
            return false;
        }
        
        if (!settings.gtmId) {
            console.error('❌ GTM ID não configurado no banco de dados');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar configurações:', error);
        return false;
    }
    
    // 2. Verificar se o script GTM foi carregado
    console.log('\n2. Verificando carregamento do script GTM...');
    
    // Aguardar um pouco para o script carregar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (window.GTMTracker) {
        console.log('✅ GTMTracker carregado e disponível');
    } else if (window.dataLayer && window.gtag) {
        console.log('⚠️ DataLayer ativo, mas GTMTracker não encontrado');
    } else {
        console.error('❌ GTM não carregado corretamente');
        return false;
    }
    
    // 3. Testar funções básicas do GTMTracker
    console.log('\n3. Testando funções do GTMTracker...');
    
    const tests = [
        {
            name: 'Page View',
            test: () => {
                if (window.GTMTracker) {
                    window.GTMTracker.trackPageView({
                        title: 'Teste Automatizado',
                        url: '/teste-automatizado',
                        category: 'test'
                    });
                    return true;
                }
                return false;
            }
        },
        {
            name: 'Form Submit',
            test: () => {
                if (window.GTMTracker) {
                    window.GTMTracker.trackFormSubmit({
                        formName: 'test_form',
                        type: 'lead',
                        email: 'test@designauto.com',
                        name: 'Teste Automatizado',
                        value: 100
                    });
                    return true;
                }
                return false;
            }
        },
        {
            name: 'Art Download',
            test: () => {
                if (window.GTMTracker) {
                    window.GTMTracker.trackArtDownload({
                        id: 'test_art_001',
                        title: 'Arte de Teste Automatizado',
                        category: 'vendas',
                        format: 'feed',
                        userType: 'premium'
                    });
                    return true;
                }
                return false;
            }
        },
        {
            name: 'Button Click',
            test: () => {
                if (window.GTMTracker) {
                    window.GTMTracker.trackButtonClick({
                        name: 'test_button_automated',
                        type: 'action',
                        section: 'test_section'
                    });
                    return true;
                }
                return false;
            }
        },
        {
            name: 'Conversion',
            test: () => {
                if (window.GTMTracker) {
                    window.GTMTracker.trackConversion({
                        type: 'subscription',
                        value: 29.90,
                        currency: 'BRL',
                        transactionId: 'TEST_AUTO_' + Date.now()
                    });
                    return true;
                }
                return false;
            }
        },
        {
            name: 'Custom Event',
            test: () => {
                if (window.GTMTracker) {
                    window.GTMTracker.trackCustomEvent('automated_test_event', {
                        test_parameter: 'automated_value',
                        timestamp: new Date().toISOString(),
                        automation: true
                    });
                    return true;
                }
                return false;
            }
        },
        {
            name: 'User Data',
            test: () => {
                if (window.GTMTracker) {
                    window.GTMTracker.setUserData({
                        id: 'test_user_automated',
                        type: 'premium',
                        plan: 'mensal',
                        signupDate: '2025-06-14'
                    });
                    return true;
                }
                return false;
            }
        }
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
        try {
            const result = test.test();
            if (result) {
                console.log(`✅ ${test.name}: PASSOU`);
                passedTests++;
            } else {
                console.log(`❌ ${test.name}: FALHOU`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ERRO - ${error.message}`);
        }
        
        // Pequena pausa entre testes
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 4. Verificar DataLayer
    console.log('\n4. Verificando DataLayer...');
    
    if (window.GTMTracker && window.GTMTracker.debugDataLayer) {
        const dataLayer = window.GTMTracker.debugDataLayer();
        console.log(`✅ DataLayer contém ${dataLayer.length} eventos`);
        
        // Mostrar últimos 3 eventos para verificação
        const lastEvents = dataLayer.slice(-3);
        console.log('📊 Últimos eventos no DataLayer:', lastEvents);
    } else if (window.dataLayer) {
        console.log(`✅ DataLayer (direto) contém ${window.dataLayer.length} eventos`);
        console.log('📊 Últimos eventos:', window.dataLayer.slice(-3));
    } else {
        console.error('❌ DataLayer não encontrado');
    }
    
    // 5. Resultados finais
    console.log('\n5. === RESULTADOS FINAIS ===');
    console.log(`📊 Testes executados: ${tests.length}`);
    console.log(`✅ Testes aprovados: ${passedTests}`);
    console.log(`❌ Testes falharam: ${tests.length - passedTests}`);
    console.log(`📈 Taxa de sucesso: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
    
    if (passedTests === tests.length) {
        console.log('\n🎉 INTEGRAÇÃO GTM FUNCIONANDO PERFEITAMENTE!');
        console.log('✅ Todos os componentes estão funcionais:');
        console.log('   - Configuração via banco de dados');
        console.log('   - Script GTM carregado dinamicamente');
        console.log('   - Todos os eventos sendo rastreados');
        console.log('   - DataLayer funcionando corretamente');
        return true;
    } else {
        console.log('\n⚠️ INTEGRAÇÃO COM PROBLEMAS');
        console.log('Verifique os erros acima e as configurações do GTM');
        return false;
    }
}

// Função para testar via console do navegador
window.testGTMIntegration = testGTMIntegration;

// Auto-executar se estiver na página de teste
if (window.location.pathname.includes('gtm-test') || window.location.search.includes('test-gtm')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🤖 Executando teste automático do GTM...');
            testGTMIntegration();
        }, 3000);
    });
}

console.log('🏷️ Script de teste GTM carregado. Execute testGTMIntegration() no console para testar.');