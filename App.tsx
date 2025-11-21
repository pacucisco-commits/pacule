import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Product, AdCreative, SalesPage, AppStep, Language } from './types';
import { STEPS, DEFAULT_MARGIN } from './constants';
import * as geminiService from './services/geminiService';
import Header from './components/Header';
import Loader from './components/common/Loader';
import Icon from './components/common/Icon';

// @ts-ignore
declare const window: {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  };

// Helper components defined outside the main App component to avoid re-rendering issues
const StepIndicator: React.FC<{ currentStep: AppStep }> = ({ currentStep }) => {
    return (
        <nav className="flex items-center justify-center p-4" aria-label="Progress">
            <ol role="list" className="flex items-center space-x-2 md:space-x-8">
                {STEPS.map((step) => (
                    <li key={step.name} className="flex-1 md:flex-initial">
                        <div className={`group flex flex-col items-center w-full`}>
                            <span className="flex items-center px-6 py-2 text-sm font-medium">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full 
                                    ${currentStep === step.id ? 'bg-brand-primary' : 'bg-brand-card border-2 border-gray-600'}`}>
                                    {step.id === AppStep.IMPORT && <ImportIcon />}
                                    {step.id === AppStep.CREATIVES && <CreativeIcon />}
                                    {step.id === AppStep.SALES_PAGE && <PageIcon />}
                                </span>
                                <span className="ml-4 hidden md:flex flex-col">
                                    <span className={`text-sm font-medium ${currentStep === step.id ? 'text-brand-primary' : 'text-gray-400'}`}>{step.name}</span>
                                    <span className="text-xs text-gray-500">{step.description}</span>
                                </span>
                            </span>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
};

const ApiKeySelector: React.FC<{ onKeySelected: () => void }> = ({ onKeySelected }) => {
    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Optimistically assume key is selected and proceed to avoid race conditions.
            onKeySelected();
        }
    };

    return (
        <div className="fixed inset-0 bg-brand-dark bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-brand-card p-8 rounded-lg shadow-2xl text-center max-w-md animate-fade-in mx-4">
                <h2 className="text-2xl font-bold text-white mb-4">Selecione sua Chave de API</h2>
                <p className="text-brand-text mb-6">
                    Para gerar imagens e usar todo o potencial da IA, é necessário selecionar sua própria chave de API de um projeto Google Cloud com faturamento ativado.
                </p>
                <button
                    onClick={handleSelectKey}
                    className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-md hover:bg-purple-700 transition-colors"
                >
                    Selecionar Chave de API
                </button>
                <p className="text-xs text-gray-500 mt-4">
                    Saiba mais sobre <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-secondary">faturamento aqui</a>.
                </p>
            </div>
        </div>
    );
};


// Main App Component
const App: React.FC = () => {
    const [isKeyReady, setIsKeyReady] = useState(false);
    const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.IMPORT);
    const [url, setUrl] = useState<string>('');
    const [language, setLanguage] = useState<Language>(Language.PORTUGUESE);
    const [margin, setMargin] = useState<number>(DEFAULT_MARGIN);
    
    const [product, setProduct] = useState<Product | null>(null);
    const [creatives, setCreatives] = useState<AdCreative | null>(null);
    const [salesPage, setSalesPage] = useState<SalesPage | null>(null);

    const [loadingStates, setLoadingStates] = useState({
        importing: false,
        video: false,
        images: false,
        copy: false,
        page: false
    });

    useEffect(() => {
        const checkApiKey = async () => {
            if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
                if (await window.aistudio.hasSelectedApiKey()) {
                    setIsKeyReady(true);
                }
            } else {
                 // If aistudio is not available, assume we're in a dev environment
                 // that might have a key set, or will use mock data.
                setIsKeyReady(true);
            }
        };
        checkApiKey();
    }, []);

    const sellingPrice = useMemo(() => {
        if (!product) return 0;
        return product.supplierPrice * (1 + margin / 100);
    }, [product, margin]);

    const handleApiError = (error: any, operation: string) => {
        console.error(`Failed to ${operation}:`, error);
        const errorMessage = String(error?.message || '');
        if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('API key not valid')) {
            alert("Sua chave de API é inválida ou não tem permissão. Por favor, selecione uma chave de API válida de um projeto com faturamento ativado para continuar.");
            setIsKeyReady(false); // Reset to show the selector again
        } else {
            alert(`Falha ao ${operation}. Verifique o console para mais detalhes.`);
        }
    };


    const handleImport = useCallback(async () => {
        if (!url) return;
        setLoadingStates(prev => ({ ...prev, importing: true }));
        try {
            const importedProduct = await geminiService.importProductData(url, language);
            setProduct(importedProduct);
            setCurrentStep(AppStep.CREATIVES);
        } catch (error) {
            handleApiError(error, "importar produto");
        } finally {
            setLoadingStates(prev => ({ ...prev, importing: false }));
        }
    }, [url, language]);

    const generateCreatives = useCallback(async (type: 'video' | 'images' | 'copy') => {
        if (!product) return;
        setLoadingStates(prev => ({ ...prev, [type]: true }));
        try {
            if(type === 'video') {
                const script = await geminiService.generateAdVideoScript(product, 'TikTok', language);
                setCreatives(prev => ({ ...prev!, videoScript: script }));
            } else if (type === 'images') {
                const imagePromises = Array(4).fill(null).map(() => geminiService.generateLifestyleImage(product));
                const lifestyleImages = await Promise.all(imagePromises);
                setCreatives(prev => ({ ...prev!, lifestyleImages }));
            } else if (type === 'copy') {
                const [tiktok, facebook, reels] = await Promise.all([
                    geminiService.generateAdCopy(product, 'TikTok', language),
                    geminiService.generateAdCopy(product, 'Facebook', language),
                    geminiService.generateAdCopy(product, 'Reels', language),
                ]);
                setCreatives(prev => ({ ...prev!, adCopy: { tiktok, facebook, reels } }));
            }
        } catch (error) {
            handleApiError(error, `gerar ${type}`);
        } finally {
            setLoadingStates(prev => ({ ...prev, [type]: false }));
        }
    }, [product, language]);

    const generateSalesPage = useCallback(async () => {
        if (!product) return;
        setLoadingStates(prev => ({ ...prev, page: true }));
        try {
            const pageData = await geminiService.generateSalesPage(product, language);
            setSalesPage(pageData);
        } catch(error) {
            handleApiError(error, "gerar a página de vendas");
        } finally {
            setLoadingStates(prev => ({...prev, page: false }));
        }
    }, [product, language]);

    return (
        <div className="min-h-screen bg-brand-dark">
            {!isKeyReady && <ApiKeySelector onKeySelected={() => setIsKeyReady(true)} />}
            <Header />
            <main className={`pt-24 container mx-auto px-4 transition-filter duration-300 ${!isKeyReady ? 'blur-md pointer-events-none' : ''}`}>
                <StepIndicator currentStep={currentStep} />
                <div className="mt-8">
                    {currentStep === AppStep.IMPORT && (
                        <div className="max-w-2xl mx-auto animate-fade-in">
                            <h2 className="text-2xl font-bold text-center text-white">Comece com a URL de um Produto</h2>
                            <p className="text-center text-gray-400 mt-2">Cole o link do produto de seu fornecedor (AliExpress, CJdropshipping, etc).</p>
                            <div className="mt-8 bg-brand-card p-8 rounded-lg shadow-lg">
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="url" className="block text-sm font-medium text-brand-text">URL do Produto</label>
                                        <input type="text" id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary"/>
                                    </div>
                                    <div>
                                        <label htmlFor="language" className="block text-sm font-medium text-brand-text">Idioma de Destino</label>
                                        <select id="language" value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                                            {Object.values(Language).map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <button onClick={handleImport} disabled={loadingStates.importing || !url} className="w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-500 transition-colors">
                                        {loadingStates.importing ? <><Loader size="sm" /> Importando com IA...</> : 'Importar Produto'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentStep === AppStep.CREATIVES && product && (
                       <div className="animate-fade-in space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white">Criativos Gerados por IA para "{product.title}"</h2>
                                <p className="text-gray-400 mt-2">Gere vídeos, imagens e textos para suas campanhas de marketing.</p>
                                <button onClick={() => setCurrentStep(AppStep.SALES_PAGE)} className="mt-4 bg-brand-primary text-white font-bold py-2 px-6 rounded-md hover:bg-purple-700 transition-colors">
                                    Próximo Passo &rarr;
                                </button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Video Script */}
                                <div className="bg-brand-card p-6 rounded-lg">
                                    <h3 className="text-xl font-semibold text-white mb-4">Roteiro de Vídeo</h3>
                                    <button onClick={() => generateCreatives('video')} disabled={loadingStates.video} className="w-full bg-brand-secondary/20 text-brand-secondary font-semibold py-2 px-4 rounded-md hover:bg-brand-secondary/30 disabled:bg-gray-600/50 mb-4">
                                        {loadingStates.video ? <Loader size="sm" text="Gerando..." /> : 'Gerar Roteiro (TikTok/Reels)'}
                                    </button>
                                    <div className="prose prose-invert prose-sm bg-gray-900/50 p-4 rounded-md h-64 overflow-y-auto">
                                        {creatives?.videoScript ? <p className="whitespace-pre-wrap">{creatives.videoScript}</p> : <p className="text-gray-400">Clique para gerar um roteiro de vídeo...</p>}
                                    </div>
                                </div>
                                {/* Lifestyle Images */}
                                <div className="bg-brand-card p-6 rounded-lg">
                                    <h3 className="text-xl font-semibold text-white mb-4">Imagens de Lifestyle</h3>
                                    <button onClick={() => generateCreatives('images')} disabled={loadingStates.images} className="w-full bg-brand-secondary/20 text-brand-secondary font-semibold py-2 px-4 rounded-md hover:bg-brand-secondary/30 disabled:bg-gray-600/50 mb-4">
                                        {loadingStates.images ? <Loader size="sm" text="Gerando..." /> : 'Gerar 4 Imagens'}
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        {creatives?.lifestyleImages?.map((imgSrc, i) => (
                                            <img key={i} src={imgSrc} alt={`Lifestyle ${i+1}`} className="rounded-md aspect-square object-cover" />
                                        )) || Array(4).fill(null).map((_, i) => (
                                            <div key={i} className="rounded-md aspect-square bg-gray-900/50 flex items-center justify-center text-gray-500 text-xs">Imagem {i+1}</div>
                                        ))}
                                    </div>
                                </div>
                                 {/* Ad Copy */}
                                <div className="bg-brand-card p-6 rounded-lg">
                                    <h3 className="text-xl font-semibold text-white mb-4">Textos para Anúncios</h3>
                                    <button onClick={() => generateCreatives('copy')} disabled={loadingStates.copy} className="w-full bg-brand-secondary/20 text-brand-secondary font-semibold py-2 px-4 rounded-md hover:bg-brand-secondary/30 disabled:bg-gray-600/50 mb-4">
                                         {loadingStates.copy ? <Loader size="sm" text="Gerando..." /> : 'Gerar Textos'}
                                    </button>
                                    <div className="space-y-2 h-64 overflow-y-auto">
                                        <h4 className="font-bold text-sm text-brand-secondary">Facebook:</h4>
                                        <p className="text-xs bg-gray-900/50 p-2 rounded whitespace-pre-wrap">{creatives?.adCopy?.facebook || '...'}</p>
                                        <h4 className="font-bold text-sm text-brand-secondary">TikTok:</h4>
                                        <p className="text-xs bg-gray-900/50 p-2 rounded whitespace-pre-wrap">{creatives?.adCopy?.tiktok || '...'}</p>
                                    </div>
                                </div>
                            </div>
                       </div>
                    )}
                    {currentStep === AppStep.SALES_PAGE && product && (
                       <div className="animate-fade-in text-center pb-12">
                            <h2 className="text-3xl font-bold text-white">Página de Vendas de Alta Conversão</h2>
                            <p className="text-gray-400 mt-2 mb-6">Gere uma landing page completa e otimizada para o seu produto.</p>
                            
                            {!salesPage && <button onClick={generateSalesPage} disabled={loadingStates.page} className="bg-brand-primary text-white font-bold py-3 px-8 rounded-md hover:bg-purple-700 disabled:bg-gray-500 transition-colors">
                                {loadingStates.page ? <div className='flex items-center gap-2'><Loader size="sm" /> Gerando Página...</div> : "✨ Gerar Página com IA"}
                            </button>}

                            {salesPage && <div className="mt-8 text-left bg-white text-gray-800 rounded-lg shadow-2xl max-w-4xl mx-auto animate-slide-in-up">
                                <header className="bg-gray-100 p-4 text-center">
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{salesPage.headline}</h1>
                                </header>
                                <main className="p-6 md:p-10 space-y-8">
                                    <p className="text-lg text-gray-600 text-center">{salesPage.opening}</p>
                                    <div className="grid md:grid-cols-3 gap-6 text-center">
                                        {salesPage.benefits.map(b => (
                                            <div key={b.title} className="bg-gray-50 p-4 rounded-lg">
                                                <div className="text-purple-600 w-12 h-12 mx-auto mb-2"><Icon name={b.icon} className="w-full h-full"/></div>
                                                <h3 className="font-bold text-gray-900">{b.title}</h3>
                                                <p className="text-sm text-gray-500">{b.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                        <h3 className="font-bold text-xl text-gray-900 mb-2">Como Funciona?</h3>
                                        <p className="text-gray-600">{salesPage.howItWorks}</p>
                                    </div>
                                    <div className='space-y-4'>
                                        {salesPage.testimonials.map(t => (
                                            <div key={t.name} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                                                <div className="flex items-center mb-1">
                                                    {Array(t.rating).fill(0).map((_, i) => <Icon key={i} name="Star" className="w-5 h-5 text-yellow-400" />)}
                                                </div>
                                                <p className="italic text-gray-600">"{t.text}"</p>
                                                <p className="text-right font-semibold text-gray-800 mt-2">- {t.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                     <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-center">
                                        <p className="font-bold">{salesPage.urgency}</p>
                                    </div>
                                    <button className="w-full bg-green-500 text-white font-bold text-xl py-4 px-6 rounded-lg hover:bg-green-600 transition-transform hover:scale-105 shadow-lg">
                                        {salesPage.cta}
                                    </button>
                                </main>
                                <footer className="p-6">
                                    <button className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-500 transition-colors">
                                        Publicar na Shopify
                                    </button>
                                </footer>
                            </div>}
                       </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// SVG Icons
const ImportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>;
const CreativeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
const PageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;


export default App;
