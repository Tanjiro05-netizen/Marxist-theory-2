import React, { useState } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

const ResearchValidation = ({ isOpen, onClose }) => {
    const [expandedSections, setExpandedSections] = useState({});

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const validationSections = {
        primarySources: {
            title: "Primary Source Requirements",
            items: [
                {
                    category: "Marx's Core Texts",
                    works: ["Capital (All volumes)", "Grundrisse", "Economic & Philosophical Manuscripts"]
                },
                {
                    category: "Engels' Essential Works",
                    works: ["Anti-Dühring", "Dialectics of Nature"]
                },
                {
                    category: "Lenin's Key Texts",
                    works: ["State and Revolution", "What Is To Be Done?"]
                }
            ]
        },
        theoretical: {
            title: "Theoretical Framework Validation",
            requirements: [
                "Dialectical materialist methodology",
                "Historical materialist framework",
                "Category derivation from basic concepts",
                "Internal logical consistency"
            ]
        },
        methodology: {
            title: "Methodological Standards",
            criteria: [
                "Step-by-step theoretical derivation",
                "Empirical evidence documentation",
                "Primary source verification",
                "Contradiction analysis"
            ]
        }
    };

    return (
        <div className="bg-black/90 text-white rounded-none p-6 max-w-4xl mx-auto">
            {Object.entries(validationSections).map(([key, section]) => (
                <div key={key} className="mb-6">
                    <button
                        onClick={() => toggleSection(key)}
                        className="w-full flex items-center justify-between p-4 bg-red-900/20 rounded-none hover:bg-red-900/30 transition-colors"
                    >
                        <span className="text-xl font-semibold">{section.title}</span>
                        <ChevronDown 
                            className={`w-5 h-5 transition-transform ${
                                expandedSections[key] ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {expandedSections[key] && (
                        <div className="mt-4 pl-4 space-y-4">
                            {section.items && section.items.map((item, idx) => (
                                <div key={idx} className="bg-black/50 p-4 rounded-none">
                                    <h4 className="text-red-500 font-semibold mb-2">{item.category}</h4>
                                    <ul className="space-y-2">
                                        {item.works.map((work, workIdx) => (
                                            <li key={workIdx} className="flex items-center space-x-2 text-gray-300">
                                                <Check className="w-4 h-4 text-red-500" />
                                                <span>{work}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                            
                            {section.requirements && (
                                <ul className="space-y-2">
                                    {section.requirements.map((req, idx) => (
                                        <li key={idx} className="flex items-center space-x-2 text-gray-300">
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            
                            {section.criteria && (
                                <ul className="space-y-2">
                                    {section.criteria.map((criterion, idx) => (
                                        <li key={idx} className="flex items-center space-x-2 text-gray-300">
                                            <Check className="w-4 h-4 text-red-500" />
                                            <span>{criterion}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ResearchValidation;