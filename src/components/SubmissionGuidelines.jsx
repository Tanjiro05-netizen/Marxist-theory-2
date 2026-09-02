import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Reusable SVG Icon for the accordion arrow
const AccordionIcon = ({ isOpen }) => (
    <svg 
        className={`w-6 h-6 transform transition-transform text-red-300 ${isOpen ? 'rotate-180' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
    </svg>
);

// Reusable Accordion Item Component
const AccordionItem = ({ title, children, isOpen, onClick }) => {
    return (
        <div className="bg-stone-900 border border-red-900/50 rounded-none">
            <div className="flex justify-between items-center p-4 cursor-pointer" onClick={onClick}>
                <h2 className="text-xl font-semibold text-red-300">{title}</h2>
                <AccordionIcon isOpen={isOpen} />
            </div>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
                <div className="p-4 border-t border-red-900/50">
                    {children}
                </div>
            </div>
        </div>
    );
};


// --- METHODOLOGICAL GUIDELINES COMPONENT ---
const MethodologicalGuidelines = () => {
    const { t } = useTranslation();
    const [openAccordion, setOpenAccordion] = useState(null);

    const toggleAccordion = (index) => {
        setOpenAccordion(openAccordion === index ? null : index);
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-center text-red-300 mb-6">{t('guidelines.methodTitle')}</h1>
            <AccordionItem title={t('guidelines.m1Title')} isOpen={openAccordion === 0} onClick={() => toggleAccordion(0)}>
                <p className="mb-4 text-gray-400">{t('guidelines.m1Intro')}</p>
                <ul className="space-y-4">
                    <li className="flex items-start">
                        <span className="text-green-400 mr-3 mt-1">✓</span>
                        <div>
                            <h4 className="font-semibold text-gray-200">{t('guidelines.p1Title')}</h4>
                            <p className="text-gray-400">{t('guidelines.p1Desc')}</p>
                        </div>
                    </li>
                    <li className="flex items-start">
                         <span className="text-green-400 mr-3 mt-1">✓</span>
                        <div>
                            <h4 className="font-semibold text-gray-200">{t('guidelines.p2Title')}</h4>
                            <p className="text-gray-400">{t('guidelines.p2Desc')}</p>
                        </div>
                    </li>
                    <li className="flex items-start">
                         <span className="text-green-400 mr-3 mt-1">✓</span>
                        <div>
                            <h4 className="font-semibold text-gray-200">{t('guidelines.p3Title')}</h4>
                            <p className="text-gray-400">{t('guidelines.p3Desc')}</p>
                        </div>
                    </li>
                    <li className="flex items-start">
                         <span className="text-green-400 mr-3 mt-1">✓</span>
                        <div>
                            <h4 className="font-semibold text-gray-200">{t('guidelines.p4Title')}</h4>
                            <p className="text-gray-400">{t('guidelines.p4Desc')}</p>
                        </div>
                    </li>
                    <li className="flex items-start">
                         <span className="text-green-400 mr-3 mt-1">✓</span>
                        <div>
                            <h4 className="font-semibold text-gray-200">{t('guidelines.p5Title')}</h4>
                            <p className="text-gray-400">{t('guidelines.p5Desc')}</p>
                        </div>
                    </li>
                </ul>
            </AccordionItem>
            <AccordionItem title={t('guidelines.m2Title')} isOpen={openAccordion === 1} onClick={() => toggleAccordion(1)}>
                <div className="space-y-6">
                    <p className="text-gray-400">{t('guidelines.m2Intro')}</p>
                    
                    <div>
                        <h3 className="font-bold text-lg text-red-300 mb-2">{t('guidelines.fATitle')}</h3>
                        <p className="text-gray-400">{t('guidelines.fADesc')}
                        <br/><strong>{t('guidelines.benchmarks')}</strong> K. Marx, <em>Das Kapital</em>; V.I. Lenin, <em>Imperialism, the Highest Stage of Capitalism</em>.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-red-300 mb-2">{t('guidelines.fBTitle')}</h3>
                        <p className="text-gray-400">{t('guidelines.fBDesc')}
                        <br/><strong>{t('guidelines.benchmarks')}</strong> K. Marx & F. Engels, <em>The German Ideology (Part I)</em>; F. Engels, <em>Anti-Dühring</em>; Papers like "On Free Will" that synthesize philosophy with neuroscience.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-red-300 mb-2">{t('guidelines.fCTitle')}</h3>
                        <p className="text-gray-400">{t('guidelines.fCDesc')}
                        <br/><strong>{t('guidelines.benchmarks')}</strong> K. Marx, <em>The Eighteenth Brumaire of Louis Bonaparte</em>; F. Engels, <em>The Origin of the Family, Private Property and the State</em>.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-red-300 mb-2">{t('guidelines.fDTitle')}</h3>
                        <p className="text-gray-400">{t('guidelines.fDDesc')}
                        <br/><strong>{t('guidelines.benchmarks')}</strong> The formal, algebraic approach to social dynamics (e.g., Bordiga's "Passion and Algebra"); modern works in systems biology, computational neuroscience, or physics that explore dynamic systems and emergent properties.</p>
                    </div>
                </div>
            </AccordionItem>
        </>
    );
};

// --- FORMATTING GUIDELINES COMPONENT ---
const FormattingGuidelines = () => {
    const { t } = useTranslation();
    const [openAccordion, setOpenAccordion] = useState(null);

    const toggleAccordion = (index) => {
        setOpenAccordion(openAccordion === index ? null : index);
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-center text-red-300 mb-6">{t('guidelines.fmtTitle')}</h1>
            <AccordionItem title={t('guidelines.fmt1Title')} isOpen={openAccordion === 0} onClick={() => toggleAccordion(0)}>
                 <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold text-lg text-red-300 mb-2">{t('guidelines.basicFmtTitle')}</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><strong>{t('guidelines.fontLabel')}</strong> {t('guidelines.fontVal')}</li>
                            <li><strong>{t('guidelines.headingsLabel')}</strong> {t('guidelines.headingsVal')}</li>
                            <li><strong>{t('guidelines.spacingLabel')}</strong> {t('guidelines.spacingVal')}</li>
                            <li><strong>{t('guidelines.marginsLabel')}</strong> {t('guidelines.marginsVal')}</li>
                            <li><strong>{t('guidelines.alignLabel')}</strong> {t('guidelines.alignVal')}</li>
                            <li><strong>{t('guidelines.pageNumsLabel')}</strong> {t('guidelines.pageNumsVal')}</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-red-300 mb-2">{t('guidelines.orderTitle')}</h3>
                        <ol className="list-decimal list-inside space-y-2 text-gray-400">
                            <li>{t('guidelines.o1')}</li>
                            <li>{t('guidelines.o2')}</li>
                            <li>{t('guidelines.o3')}</li>
                            <li>{t('guidelines.o4')}</li>
                            <li>{t('guidelines.o5')}</li>
                            <li>{t('guidelines.o6')}</li>
                            <li>{t('guidelines.o7')}</li>
                        </ol>
                    </div>
                </div>
            </AccordionItem>
            <AccordionItem title={t('guidelines.citTitle')} isOpen={openAccordion === 1} onClick={() => toggleAccordion(1)}>
                <p className="mb-4 text-gray-400">{t('guidelines.citIntro')}</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-200">APA (7th Edition)</h4>
                        <p className="text-sm text-gray-400">{t('guidelines.inText')} (Author, Year, p. X)</p>
                        <p className="text-sm text-gray-400">{t('guidelines.usedIn')} {t('guidelines.domSocial')}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-200">Chicago (17th Edition)</h4>
                        <p className="text-sm text-gray-400">{t('guidelines.citChicagoVal')}</p>
                        <p className="text-sm text-gray-400">{t('guidelines.usedIn')} {t('guidelines.domHumanities')}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-200">MLA (9th Edition)</h4>
                        <p className="text-sm text-gray-400">{t('guidelines.inText')} (Author Page)</p>
                        <p className="text-sm text-gray-400">{t('guidelines.usedIn')} {t('guidelines.domLit')}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-200">IEEE</h4>
                        <p className="text-sm text-gray-400">{t('guidelines.inText')} [1]</p>
                        <p className="text-sm text-gray-400">{t('guidelines.usedIn')} {t('guidelines.domEng')}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-200">Vancouver</h4>
                        <p className="text-sm text-gray-400">{t('guidelines.inText')} (1) [1]</p>
                        <p className="text-sm text-gray-400">{t('guidelines.usedIn')} {t('guidelines.domMed')}</p>
                    </div>
                </div>
            </AccordionItem>
            <AccordionItem title={t('guidelines.pkgTitle')} isOpen={openAccordion === 2} onClick={() => toggleAccordion(2)}>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div>
                        <h3 className="font-semibold text-lg text-red-300 mb-2">{t('guidelines.fileSpecsTitle')}</h3>
                        <ul className="space-y-2 text-gray-400">
                           <li><strong>{t('guidelines.fsSubmission')}</strong> {t('guidelines.fsSubmissionVal')}</li>
                           <li><strong>{t('guidelines.fsFigures')}</strong> {t('guidelines.fsFiguresVal')}</li>
                           <li><strong>{t('guidelines.fsTables')}</strong> {t('guidelines.fsTablesVal')}</li>
                           <li><strong>{t('guidelines.fsWords')}</strong> {t('guidelines.fsWordsVal')}</li>
                           <li><strong>{t('guidelines.fsRefs')}</strong> {t('guidelines.fsRefsVal')}</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-red-300 mb-2">{t('guidelines.langReqTitle')}</h3>
                        <ul className="space-y-2 text-gray-400">
                           <li>{t('guidelines.lr1')}</li>
                           <li>{t('guidelines.lr2')}</li>
                           <li>{t('guidelines.lr3')}</li>
                           <li>{t('guidelines.lr4')}</li>
                           <li>{t('guidelines.lr5')}</li>
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg text-red-300 mb-2">{t('guidelines.reqDocsTitle')}</h3>
                        <ul className="space-y-2 text-gray-400">
                           <li>{t('guidelines.rd1')}</li>
                           <li>{t('guidelines.rd2')}</li>
                           <li>{t('guidelines.rd3')}</li>
                           <li>{t('guidelines.rd4')}</li>
                           <li>{t('guidelines.rd5')}</li>
                           <li>{t('guidelines.rd6')}</li>
                        </ul>
                    </div>
                </div>
            </AccordionItem>
            <AccordionItem title={t('guidelines.ethTitle')} isOpen={openAccordion === 3} onClick={() => toggleAccordion(3)}>
                <p className="mb-4 text-gray-400">{t('guidelines.ethIntro')}</p>
                <ul className="list-disc list-inside space-y-3 text-gray-300">
                    <li><strong>{t('guidelines.ePlagiarism')}</strong> {t('guidelines.ePlagiarismVal')}</li>
                    <li><strong>{t('guidelines.eEthics')}</strong> {t('guidelines.eEthicsVal')}</li>
                    <li><strong>{t('guidelines.eCoi')}</strong> {t('guidelines.eCoiVal')}</li>
                    <li><strong>{t('guidelines.eFunding')}</strong> {t('guidelines.eFundingVal')}</li>
                    <li><strong>{t('guidelines.eContrib')}</strong> {t('guidelines.eContribVal')}</li>
                </ul>
            </AccordionItem>
        </>
    );
};


// --- MAIN MODAL COMPONENT ---
const SubmissionGuidelines = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [activeView, setActiveView] = useState('methodological'); // 'methodological' or 'submission'

    if (!isOpen) return null;

    const commonButtonStyles = "px-4 py-2 rounded-none transition-colors duration-200";
    const activeButtonStyles = "bg-red-500 text-white";
    const inactiveButtonStyles = "bg-stone-800 text-gray-300 hover:bg-stone-700";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-black border border-red-900/50 rounded-none shadow-none p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-end mb-4">
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-center mb-8 bg-stone-900 border border-red-900/50 p-2 rounded-none space-x-2">
                            <button 
                                onClick={() => setActiveView('methodological')} 
                                className={`${commonButtonStyles} ${activeView === 'methodological' ? activeButtonStyles : inactiveButtonStyles}`}
                            >
                                {t('guidelines.tabMethod')}
                            </button>
                            <button 
                                onClick={() => setActiveView('submission')} 
                                className={`${commonButtonStyles} ${activeView === 'submission' ? activeButtonStyles : inactiveButtonStyles}`}
                            >
                                {t('guidelines.tabSubmit')}
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {activeView === 'methodological' ? <MethodologicalGuidelines /> : <FormattingGuidelines />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SubmissionGuidelines;