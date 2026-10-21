import React from 'react';
import Link from 'next/link';
import * as s from './NotFoundPage.css.ts';

const NotFoundPage = () => {
  return (
    <div className={s.page}>
      <div className={s.inner}>
        <h1 className={s.code}>404</h1>
        <h2 className={s.title}>Page Not Found</h2>
        <p className={s.text}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/home" className={s.backLink}>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
