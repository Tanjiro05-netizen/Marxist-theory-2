import React, { useRef } from 'react';
import { Download, Award, Share2, X } from 'lucide-react';

const CertificateViewer = ({ certificate, course, user, onClose }) => {
  const certificateRef = useRef(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = async () => {
    // Use html2canvas if available, otherwise open print dialog
    if (window.html2canvas) {
      const canvas = await window.html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#1a1f2b'
      });
      const link = document.createElement('a');
      link.download = `certificate-${certificate.certificate_number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else {
      window.print();
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/verify/${certificate.certificate_number}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate of Completion - ${course.title}`,
          text: `I completed the ${course.title} course!`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Your Certificate</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-none transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div 
          ref={certificateRef}
          className="bg-[#10131b] from-[#1a1f2b] to-[#10131b] rounded-none border-4 border-red-600/50 p-8 md:p-12 print:border-red-600"
          style={{ aspectRatio: '1.414' }}
        >
          {/* Border Decoration */}
          <div className="h-full border-2 border-red-900/30 rounded-none p-6 md:p-10 flex flex-col items-center justify-between">
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Award className="w-12 h-12 text-yellow-500" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                Certificate of Completion
              </h1>
              <p className="text-gray-400 text-sm md:text-base">
                This is to certify that
              </p>
            </div>

            {/* Recipient */}
            <div className="text-center my-6">
              <h2 className="text-3xl md:text-5xl font-bold text-red-500 mb-2">
                {user?.display_name || user?.email?.split('@')[0] || 'Student'}
              </h2>
              <p className="text-gray-300 text-lg">
                has successfully completed the course
              </p>
            </div>

            {/* Course */}
            <div className="text-center my-6">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {course.title}
              </h3>
              <p className="text-gray-400">
                {course.stem_subjects?.name || 'STEM'}
              </p>
              {certificate.final_score && (
                <p className="text-green-400 mt-2">
                  Final Score: {certificate.final_score}%
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-auto">
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="w-32 border-t border-gray-600 mb-2"></div>
                  <p className="text-gray-500 text-xs">Date of Completion</p>
                  <p className="text-gray-300 text-sm">
                    {formatDate(certificate.issued_at)}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-t border-gray-600 mb-2"></div>
                  <p className="text-gray-500 text-xs">Certificate Number</p>
                  <p className="text-gray-300 text-sm font-mono">
                    {certificate.certificate_number}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-xs mt-4">
                Verify at: {window.location.origin}/verify/{certificate.certificate_number}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;
