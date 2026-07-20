import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { Award, Check, X, Calendar, BookOpen, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as s from './CertificateVerifyPage.css.ts';

const CertificateVerifyPage = () => {
  const { certificateNumber } = useParams();
  const { user, profile, isAdmin } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const verifyCertificate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('stem_certificates')
        .select('id, user_id, course_id, certificate_number, issued_at, final_score')
        .eq('certificate_number', certificateNumber)
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      const verifiedCertificate = data?.[0];
      if (!verifiedCertificate) {
        setCertificate(null);
        setError('Certificate not found');
        return;
      }

      setCertificate({ ...verifiedCertificate, profiles: null });
    } catch (err) {
      console.error('Error verifying certificate:', err);
      setError('Error verifying certificate');
    } finally {
      setIsLoading(false);
    }
  }, [certificateNumber]);

  useEffect(() => {
    verifyCertificate();
  }, [verifyCertificate]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canViewCourses = !!user && (profile?.has_invite_access || isAdmin());
  const courseHref = certificate?.stem_courses?.slug
    ? `/science-tech/courses/${certificate.stem_courses.slug}`
    : '/home';
  const fallbackHref = canViewCourses ? '/science-tech' : '/home';
  const fallbackLabel = canViewCourses ? '← Back to courses' : '← Return Home';

  return (
    <div className={s.page}>
      <div className={s.inner}>
          {isLoading ? (
            <div className={s.loadingWrap}>
              <div className={s.spinner} />
              <p className={s.loadingText}>Verifying certificate...</p>
            </div>
          ) : error ? (
            <div className={s.errorWrap}>
              <div className={s.errorIcon}><X size={40} /></div>
              <h1 className={s.errorTitle}>Certificate Not Found</h1>
              <p className={s.errorText}>The certificate number "{certificateNumber}" could not be verified.</p>
              <Link href={fallbackHref} className={s.errorLink}>{fallbackLabel}</Link>
            </div>
          ) : certificate && (
            <div className={s.successWrap}>
              <div className={s.successIcon}><Check size={48} /></div>
              <h1 className={s.successTitle}>Certificate Verified</h1>
              <p className={s.successSubtitle}>This certificate is authentic and valid</p>

              <div className={s.card}>
                <div className={s.cardHeader}>
                  <div className={s.cardIconWrap}><Award size={32} /></div>
                  <div>
                    <h2 className={s.cardTitle}>Certificate of Completion</h2>
                    <p className={s.cardNumber}>{certificate.certificate_number}</p>
                  </div>
                </div>

                <div className={s.detailStack}>
                  <div className={s.detailRow}>
                    <User size={18} className={s.detailIcon} />
                    <div>
                      <p className={s.detailLabel}>Awarded to</p>
                      <p className={s.detailValue}>{certificate.profiles?.display_name || certificate.profiles?.email?.split('@')[0] || 'Student'}</p>
                    </div>
                  </div>

                  <div className={s.detailRow}>
                    <BookOpen size={18} className={s.detailIcon} />
                    <div>
                      <p className={s.detailLabel}>Course completed</p>
                      <p className={s.detailValue}>{certificate.stem_courses?.title}</p>
                      <p className={s.detailSub}>{certificate.stem_courses?.stem_subjects?.name}</p>
                    </div>
                  </div>

                  <div className={s.detailRow}>
                    <Calendar size={18} className={s.detailIcon} />
                    <div>
                      <p className={s.detailLabel}>Date issued</p>
                      <p className={s.detailValue}>{formatDate(certificate.issued_at)}</p>
                    </div>
                  </div>

                  {certificate.final_score && (
                    <div className={s.detailRow}>
                      <Award size={18} className={s.detailIcon} />
                      <div>
                        <p className={s.detailLabel}>Final score</p>
                        <p className={s.detailScore}>{certificate.final_score}%</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={s.cardFooter}>
                  {canViewCourses ? (
                    <Link href={courseHref} className={s.primaryBtn}>View Course</Link>
                  ) : (
                    <>
                      <Link href="/login" className={s.primaryBtn}>Register to access courses</Link>
                      <Link href="/digital-library" className={s.secondaryBtn}>Browse public library</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default CertificateVerifyPage;
