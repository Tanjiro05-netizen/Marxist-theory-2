/* Route-level loading boundary. Shows during navigation while the target
   route's payload/chunk resolves — keeps transitions responsive instead of
   freezing on the previous page. Transient only; the final page is
   unchanged. */
export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#0b0d12',
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          border: '2px solid #262a35',
          borderTopColor: '#d41f3d',
          animation: 'app-route-spin 800ms linear infinite',
        }}
      />
      <style>{`@keyframes app-route-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
