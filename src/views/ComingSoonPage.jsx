import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, BookMarked, GraduationCap, FlaskConical, LineChart, Users, MessageSquare, HelpCircle, Newspaper } from 'lucide-react';
import dynamic from 'next/dynamic';

/* recharts is code-split: the coming-soon screen must not ship a chart
   library. Markup lives, unchanged, in ComingSoonTeaser. */
const VisualizationTeaser = dynamic(() => import('../components/ComingSoonTeaser'), {
    ssr: false,
    loading: () => <div style={{ minHeight: 220 }} />,
});
import * as s from './ComingSoonPage.css.ts';

/* Titles/descriptions resolve through i18n at render time. */
const FEATURE_CONFIG = {
    theory: { icon: BookMarked, titleKey: 'comingSoon.theoryTitle', descKey: 'comingSoon.theoryDesc' },
    study: { icon: GraduationCap, titleKey: 'comingSoon.studyTitle', descKey: 'comingSoon.studyDesc' },
    'science-tech': { icon: FlaskConical, titleKey: 'comingSoon.scienceTechTitle', descKey: 'comingSoon.scienceTechDesc' },
    visualizations: { icon: LineChart, titleKey: 'comingSoon.vizTitle', descKey: 'comingSoon.vizDesc' },
    directory: { icon: Users, titleKey: 'comingSoon.directoryTitle', descKey: null },
    forum: { icon: MessageSquare, titleKey: 'comingSoon.forumTitle', descKey: 'comingSoon.forumDesc' },
    knowledge: { icon: HelpCircle, titleKey: 'comingSoon.knowledgeTitle', descKey: 'comingSoon.knowledgeDesc' },
    politics: { icon: Newspaper, titleKey: 'comingSoon.politicsTitle', descKey: 'comingSoon.politicsDesc' },
};

const ComingSoonPage = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const featureKey = searchParams.get('feature');
    const feature = FEATURE_CONFIG[featureKey];
    const FeatureIcon = feature?.icon;

    return (
        <div className={s.page}>
            <div className={s.inner}>
                {feature && (
                    <div className={s.featureIconFrame}>
                        <FeatureIcon size={28} />
                    </div>
                )}

                <p className={s.kicker}>{t('comingSoon.kicker')}</p>
                <h1 className={s.title}>{feature ? t(feature.titleKey) : t('common.comingSoon')}</h1>
                <div className={s.rule} />

                <p className={s.subtitle}>
                    {feature && feature.descKey ? t(feature.descKey) : t('comingSoon.defaultDesc')}
                </p>

                {featureKey === 'visualizations' && <VisualizationTeaser />}

                {!feature && (
                    <div className={s.card}>
                        <h2 className={s.cardTitle}>{t('comingSoon.whatToExpect')}</h2>
                        <p className={s.cardText}>{t('comingSoon.cardText1')}</p>
                        <p className={s.cardText}>{t('comingSoon.cardText2')}</p>
                    </div>
                )}

                {feature && (
                    <Link href="/login" className={s.registerCta}>
                        <Lock size={16} />
                        {t('comingSoon.registerToUnlock')}
                    </Link>
                )}

                <button onClick={() => router.push('/')} className={s.backButton}>
                    <ArrowLeft size={16} />
                    {t('comingSoon.returnHome')}
                </button>
            </div>
        </div>
    );
};

export default ComingSoonPage;
