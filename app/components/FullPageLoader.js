// app/components/FullPageLoader.js
export default function FullPageLoader() {
    return (
      <div className="page-loading position-center-center">
        <div className="loading-content">
          <img src="/logo-hm.png" alt="Logo" className="loading-logo" />
          <div className="spinner position-center m-t-3" />
        </div>
      </div>
    );
  }  