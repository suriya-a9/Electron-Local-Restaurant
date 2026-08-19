import Login from "./Login";

export default function ClientLogin() {
    return <Login portal="client" endpoint="/clientAuth/login" />;
}