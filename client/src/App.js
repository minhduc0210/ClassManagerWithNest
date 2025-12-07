import { BrowserRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Register from './pages/register/Register';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/login/Login";
import { AuthContext } from "./context/AuthContext";
import WelcomePage from "./pages/welcome_page/WelcomePage";
import Home from "./pages/home/Home";
import Header from "./component/Header/Header";
import Footer from "./component/Footer/Footer";
import { useContext } from "react";
import Classroom from "./pages/classroom/Classroom";
import Post from "./pages/classroom/Post";
import UserProfile from "./pages/profile/UserProfile";

function App() {
  const { isLoggin } = useContext(AuthContext);
  console.log(isLoggin)
  return (
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Header />
        <Routes>
          <Route path="/" element={isLoggin ? <Home /> : <WelcomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/classroom/:classroomID" element={<Classroom />} />
          <Route path="/classroom/:classroomID/:slotID" element={<Post />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
        <Footer />
      </BrowserRouter>
  );
}

export default App;
