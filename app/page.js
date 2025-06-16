'use client';
import Navbar from './components/Navbar';
import Link from 'next/link';

export default function UpgradeProfile() {
  return (
    <>
      <Navbar />
      <div className="row p-t-15 p-b-10">
        <h1>
          <span>Misija:</span> Mož pravi, da bo projekt imel samo par objav.😄 Hvala za vsako objavo!
        </h1>
      </div>
      <div className='relative-container relative-container-bg-r'>
        <div className='r-container-l conteiner-img-1'></div>
        <div className='r-container-r'>
          <div className='position-center-center'>
            <div className='right-side-content text-center'>
              <div className="right-side-logo m-b-2">
                <img src="logo-hm.png" alt="Logo" />
              </div>
              <div className="right-side-text">
                  <div className="p-b-3">
                    <h1><span>Soustvarjaj</span>, <span>deli</span>, <span>sledi</span> ali <span>okrivaj</span> v tvojem mami svetu.</h1>
                    <p className="p-t-3">Pridruži se POPOLNOMA BREZPLAČNO</p>
                    <div className='m-t-5'>
                      <Link href="/prijava" className="btn-1">Prijavi se</Link>
                      <Link href="/registracija" className="btn-2">Registriraj se BREZPLAČNO</Link>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className='relative-container'>
        <div className='r-container-l'>
        <div className='position-center-center'>
            <div className='right-side-content text-center'>
              <div className="right-side-logo m-b-2">
                <img src="logo-hm.png" alt="Logo" />
              </div>
              <div className="right-side-text">
                  <div className="p-b-3">
                    <h1>, ker <span>spremljaš </span>naše <span>zlate ustvarjalce</span> z izjemno vsebino.</h1>
                    <p className="p-t-3">Spremljajte naše zlate profile ali pa z izvirnostjo in kreativnosto postani tudi ti. Ker se zavedamo, da ste zlati VI.</p>
                  </div>
                  <Link href="/prijava" className="btn-1">buffbunny_lana</Link>
                  <Link href="/prijava" className="btn-1">adjasitar</Link>
                  <Link href="/prijava" className="btn-1">gabi.and.co</Link>
                  <span className='btn-1'>+ 30</span>
              </div>
            </div>
          </div>
        </div>
        <div className='r-container-r conteiner-img-2'>
        </div>
      </div>



      <div className='relative-container relative-container-bg-r'>
        <div className='r-container-l container-1'></div>
        <div className='r-container-r'>
          <div className='position-center-center'>
            <div className='position-center-center'>
              <div className='right-side-content text-center'>
                <div className="right-side-logo m-b-2">
                  <img src="logo-hm.png" alt="Logo" />
                </div>
                <div className="right-side-text">
                    <div className="p-b-3">
                      <h1>Prvo <span>SLOVENSKO</span> omrežje, ki temelji na <span>uporabnikih</span>.<i className="bi bi-patch-check-fill"></i><i className="bi bi-handbag"></i></h1>
                      <p className="p-t-3">Filozofija omrežja je, da je povdarek na uporabniku. Zato ima vsak profil možnost do ekslozivne značke, ki vpliva na celotno izkušnjo.</p>
                    </div>
                </div>
                <div className='right-side-logo m-b-2'>
                  <img src="https://www.slovenia.info/images/logos/logo.png" alt="IFEELSLOVENIA" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='relative-container'>
        <div className='r-container-l'>
          <div className='position-center-center'>
            <div className='right-side-content text-center'>
              <div className="right-side-logo m-b-2">
                <img src="logo-hm.png" alt="Logo" />
              </div>
              <div className="right-side-text">
                  <div className="p-b-3">
                    <h1>, ker imaš vso <span>dogajanje</span>, ki te zanima vedno pri roki.</h1>
                    <p className="p-t-3">Zid vsebuje vse hitre informacije, ki jih potrebuješ. Zavedamo se, da imamo mamice hitrejši tempo življenja. Zato hočemo informacije hitro.</p>
                  </div>
              </div>
            </div>
          </div>
        </div>
        <div className='r-container-r conteiner-1'>
        </div>
      </div>



      <div className='relative-container relative-container-bg-r'>
        <div className='r-container-l container-1'></div>
        <div className='r-container-r'>
          <div className='position-center-center'>
            <div className='right-side-content text-center'>
              <div className="right-side-logo m-b-2">
                <img src="logo-hm.png" alt="Logo" />
              </div>
              <div className="right-side-text">
                  <div className="p-b-3">
                    <h1><span>Soustvarjaj</span>, <span>deli</span>, <span>sledi</span> ali <span>okrivaj</span> v tvojem mami svetu.</h1>
                    <p className="p-t-3">Pridruži se POPOLNOMA BREZPLAČNO</p>
                    <div className='m-t-5'>
                      <Link href="/prijava" className="btn-1">Prijavi se</Link>
                      <Link href="/registracija" className="btn-2">Registriraj se BREZPLAČNO</Link>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}