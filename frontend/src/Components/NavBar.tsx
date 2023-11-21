import {Link, Outlet, useNavigate} from "react-router-dom";
import {Button, Stack, Typography} from "@mui/material";
import {grey} from "@mui/material/colors";
import {useContext} from "react";
// import {UserStateContext} from "../State/UserState";

const linkStyle = {
    textDecoration: "none",
}

const NavBar = () => {
    const navigate = useNavigate();
    // const {username, setUsername} =  useContext(UserStateContext);

    return(
        <div>Hello</div>
    )
}

export default NavBar;