// Hooks and other utilities
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TokenContextProvider } from "./tokenContext";

// Components
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Layout from "./Layout";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import Create from "@/pages/Create";
import Search from "@/pages/Search";
import Profile from "@/pages/Profile";
import User from "@/pages/User";

// Requests

const App = () => {
	return (
		<Router>
			<TokenContextProvider>
				<Layout>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/settings" element={<Settings />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="/create" element={<Create />} />
						<Route path="/search" element={<Search />} />
						<Route path="/profile" element={<Profile />} />
						<Route path="/user/:username" element={<User />} />
					</Routes>
				</Layout>
			</TokenContextProvider>
		</Router>
	);
};

export default App;
