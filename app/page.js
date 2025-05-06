'use client';
import Navbar from './components/Navbar';

export default function UpgradeProfile() {
  return (
    <>
      <Navbar />
      <div className="container">
        <div className="container-content-full">
          <div className="row row-bg p-b-10">
            <div className="row-inner-nbg">
              <div className="m-b-5">
                <h1>Tukaj bo prva predstavitvena stran</h1>
                <p>Zelo lepo stran imam če ti je prav ali ne!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}