import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// views
import Register from "./views/Register";
import Login from "./views/Login";
import Main from "./layout/Main";
import Dashboard from "./views/Dashboard";
import Users from "./views/Userlist";
import Shelf from "./components/Shelf";
import Borrowers from "./components/Borrowers";
import Home from "./layout/Home";
import HomeLibrary from "./components/HomeLibrary";
import RegisterAdmin from "./views/RegisterAdmin";
import Borrowed from "./components/Borrowed";
import Returned from "./components/Returned";
import Settings from "./components/Settings";
import Penailties from "./components/Penailties";
import ReturnList from "./components/ReturnList";
import PenaltyList from "./components/PenaltyList";
import Files from "./components/Files";
import FilesStudent from "./components/FilesStudent";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" Component={Login} />
        <Route path="/register" Component={Register} />
        <Route path="/register-admin" Component={RegisterAdmin} />
        <Route path="/library" Component={Main}>
          <Route path="" index Component={Dashboard} />
          <Route path="Users" Component={Users} />
          <Route path="Shelf" Component={Shelf} />
          <Route path="Borrowers" Component={Borrowers} />
          <Route path="returned" Component={ReturnList} />
          <Route path="penalties" Component={PenaltyList} />
          <Route path="files" Component={Files} />
        </Route>
        <Route path="/home" Component={Home}>
          <Route path="" index Component={HomeLibrary} />
          <Route path="borrowed" index Component={Borrowed} />
          <Route path="returned" index Component={Returned} />
          <Route path="setting" index Component={Settings} />
          <Route path="penalties" index Component={Penailties} />
          <Route path="files" index Component={FilesStudent} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
