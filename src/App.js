// App.js -- routing hub

import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';

// Shared layout components
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

// Page Components (one per route)
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Events from './pages/Events/Events';
import GetInvolved from './pages/GetInvolved/GetInvolved';

function App() {
  return (
      // BrowserRouter enabled
      <BrowserRouter>
        <div className="App">

          {/* header outside routes to always render */}
          <Header />

          {/* main fills space between header and footer */}
          <main>
            {/* routes render only the first route that matches url*/}
            <Routes>
              <Route path="/"             element={<Home />} />
              <Route path="/about"        element={<About />} />
              <Route path="/events"       element={<Events />} />
              <Route path="/get-involved" element={<GetInvolved />} />
            </Routes>
          </main>
          
          <Footer />
          
        </div>
      </BrowserRouter>
  );
}

export default App;