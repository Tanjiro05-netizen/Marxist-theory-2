import React from 'react';
import * as s from '../styles/obsidianTheme.css.ts';

/**
 * Centered publication-style page header: crimson kicker, serif title,
 * short red rule, optional note and action row.
 */
export default function PageHeader({ kicker, title, note, actions }) {
    return (
        <header className={s.pageHeader}>
            {kicker ? <p className={s.pageKicker}>{kicker}</p> : null}
            <h1 className={s.pageTitle}>{title}</h1>
            <div className={s.pageRule} aria-hidden="true" />
            {note ? <p className={s.pageNote}>{note}</p> : null}
            {actions ? <div className={s.pageActions}>{actions}</div> : null}
        </header>
    );
}
