import React, { useContext, useState } from "react";
import "./LoginPage.scss";
import {
    TextField,
    Button,
    Typography,
    Paper,
    useMediaQuery,
    InputAdornment,
    IconButton,
    Box
} from "@mui/material";
import { fetchLoginApi } from "../../API/LoginAPI/LoginAPI";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import loginPageLottie from "../../assets/lotties/loginPage.json";
import { initializeSocket } from "../../socket";
import { LoginContext } from "../../context/LoginData";
import { savePlayerId } from "../../API/SavePlayerId/SavePlayerId";
import { getToken } from "../../API/GetToken/GetToken";
import Lottie from "lottie-react";
import { getVersionString } from "../../utils/globalFunc";

export const commonTextFieldProps = {
    fullWidth: true,
    size: "small",
    className: "textfieldsClass",
};

const LoginPage1 = () => {
    const isMobile = useMediaQuery("(max-width:600px)");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [isBtnShow, setIsBtnShow] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [credentials, setCredentials] = useState({ companycode: "", userId: "", password: "" });
    const [errors, setErrors] = useState({});
    const { setAuth, setPermissions, auth, token, setToken } = useContext(LoginContext);

    const versionString = getVersionString();

    function connect(token) {
        initializeSocket(token);
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials({ ...credentials, [name]: value });
        setErrors(prev => ({ ...prev, [name]: "" }));
    };

    // Add this function inside your component
    const handleCompanyCodeBlur = async () => {
        if (credentials.companycode.trim()) {
            try {
                const token = await getToken(credentials.companycode.trim());
                if (token?.rd?.[0]?.stat == 0) {
                    setErrors(newErrors => ({ ...newErrors, companycode: "Invalid company code" }));
                    setToken({
                        sv: "",
                        yc: "",
                    });
                    sessionStorage.setItem("token", JSON.stringify(token));
                    return;
                }
                else if (token?.rd?.[0]?.stat == 1) {
                    setIsBtnShow(true)
                    const tokenData = token.rd[0];
                    setToken({
                        sv: tokenData.sv.toString(),
                        yc: tokenData.yc || "",
                    });
                    sessionStorage.setItem("token", JSON.stringify(tokenData));
                }
            } catch (error) {
                console.error("Error in handleCompanyCodeBlur:", error);
                setErrors(prev => ({ ...prev, companycode: "Error validating company code" }));
            } finally {
                setIsBtnShow(false);
            }
        }
    };

    // Simple validation function
    const validateCredentials = () => {
        const newErrors = {};
        if (!credentials.companycode) newErrors.companycode = "Project code is required";
        if (!credentials.userId) newErrors.userId = "User ID is required";
        if (!credentials.password) newErrors.password = "Password is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        try {
            if (!validateCredentials()) {
                setIsLoading(false);
                return;
            }
            const loginData = await fetchLoginApi(credentials);
            const userInfo = loginData?.rd?.[0];
            if (userInfo?.stat != 1) {
                toast.error("Invalid credentials");
                setIsLoading(false);
                return;
            }

            const userData = {
                ...userInfo,
                userId: userInfo.userid,
                username: userInfo.customercode,
                SocketId: userInfo.SocketId || "",
            };

            sessionStorage.setItem("token", JSON.stringify(userData));

            if (userInfo?.SocketId) {
                sessionStorage.setItem(
                    "hasSocketId",
                    JSON.stringify({
                        data: true,
                        socketId: userInfo.SocketId,
                        ...userData,
                    })
                );
                setPermissions(loginData?.rd1);
                console.log("⚠️ Redirecting to session check page...");
                navigate("/session-check");
                return;
            }

            const socket = initializeSocket(userInfo.token);

            const handleConnect = async () => {
                try {
                    console.log("✅ Socket connected:", socket.id);
                    await savePlayerId(
                        socket.id,
                        userData.userId,
                        userData.id
                    );
                    const updatedUserData = {
                        ...userData,
                        SocketId: socket.id,
                    };
                    sessionStorage.setItem(
                        "userData",
                        JSON.stringify(updatedUserData)
                    );
                    sessionStorage.setItem("isLoggedIn", "true");
                    setAuth(updatedUserData);
                    setPermissions(loginData?.rd1);
                    toast.success("Login successful! Welcome back!", {
                        icon: "🎉",
                    });
                    navigate("/");
                } catch (error) {
                    console.error("Socket setup error:", error);
                    toast.error("Failed to initialize session");
                } finally {
                    setIsLoading(false);
                }
            };

            // ✅ Socket connection error
            const handleError = (err) => {
                console.error("❌ Socket connect error:", err.message);
                toast.error("Socket connection failed");
                setIsLoading(false);
            };

            socket.once("connect", handleConnect);
            socket.once("connect_error", handleError);

        } catch (err) {
            console.error("Login error:", err);
            toast.error("Login failed. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-wrapper">
                <div className="decorative-circle decorative-circle--top-left"></div>

                <Paper className="login-paper">
                    {/* Left Side: Login Form */}
                    <div className="login-form-section">
                        <div className="login-form-content">
                            <Typography variant="h5" className="login-title">CHAT LOGIN</Typography>
                            <Typography variant="body2" className="login-subtitle">
                                Welcome back! Let’s get you connected.
                            </Typography>

                            {/* Project Code */}
                            <div className="form-group">
                                <Typography variant="subtitle1" className="field-label">
                                    Company Code
                                </Typography>
                                <Box
                                    sx={{
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        width: "100%",
                                    }}
                                >
                                    <TextField
                                        name="companycode"
                                        fullWidth
                                        placeholder="Enter project code"
                                        value={credentials.companycode}
                                        onChange={handleChange}
                                        onBlur={handleCompanyCodeBlur}
                                        error={!!errors.companycode}
                                        helperText={errors.companycode}
                                        {...commonTextFieldProps}
                                    />

                                    {((token?.sv && token?.yc) && credentials.companycode.trim() !== "") && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                right: "-30px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                display: "flex",
                                                alignItems: "center",
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 512 512"
                                                width="22"
                                                height="22"
                                                fill="#1b9a58"
                                            >
                                                <path d="M437.016 74.984c-99.979-99.979-262.075-99.979-362.033 0s-99.978 262.073.004 362.031 262.05 99.978 362.029-0.002 99.979-262.075 0-362.029zm-30.168 331.86c-83.318 83.318-218.396 83.318-301.691.004s-83.318-218.377-0.002-301.693 218.375-83.317 301.691 0 83.314 218.372.002 301.689z" />
                                                <path d="M368.911 155.586 234.663 289.834l-70.248-70.248c-8.331-8.331-21.839-8.331-30.17 0s-8.331 21.839 0 30.17l85.333 85.333c8.331 8.331 21.839 8.331 30.17 0l149.333-149.333c8.331-8.331 8.331-21.839 0-30.17s-21.839-8.331-30.17 0z" />
                                            </svg>
                                        </Box>
                                    )}
                                </Box>
                            </div>

                            {/* User ID */}
                            <div className="form-group">
                                <Typography variant="subtitle1" className="field-label">
                                    User Id
                                </Typography>
                                <TextField
                                    name="userId"
                                    fullWidth
                                    placeholder="Enter username"
                                    value={credentials.userId}
                                    onChange={handleChange}
                                    error={!!errors.userId}
                                    helperText={errors.userId}
                                    {...commonTextFieldProps}
                                />
                            </div>

                            {/* Password */}
                            <div className="form-group">
                                <Typography variant="subtitle1" className="field-label">
                                    Password
                                </Typography>
                                <TextField
                                    name="password"
                                    fullWidth
                                    placeholder="Enter password"
                                    type={showPassword ? "text" : "password"}
                                    value={credentials.password}
                                    onChange={handleChange}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            const isDisabled =
                                                !token ||
                                                credentials.companycode.trim() === "" ||
                                                errors.companycode === "Invalid company code" ||
                                                (credentials.companycode.trim() !== "" && !token?.sv && !token?.yc);

                                            if (!isDisabled) {
                                                handleSubmit(e);
                                            }
                                        }
                                    }}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    {...commonTextFieldProps}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            setShowPassword((prev) => !prev);
                                                        }
                                                    }}
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                    tabIndex={0}
                                                    className="password-toggle"
                                                >
                                                    {showPassword ? <EyeOff width={20} height={20} /> : <Eye width={20} height={20} />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </div>


                            <div className="login-button-container">
                                <Button
                                    variant="contained"
                                    className="buttonClassname login-button"
                                    onClick={handleSubmit}
                                    disabled={
                                        !token ||
                                        credentials.companycode.trim() === "" ||
                                        errors.companycode === "Invalid company code" ||
                                        (credentials.companycode.trim() !== "" && !token?.sv && !token?.yc)
                                    }
                                >
                                    {isLoading ? 'Logging...' : 'Login Now'}
                                </Button>
                            </div>

                        </div>
                    </div>

                    {/* Right Side: Image */}
                    {!isMobile && (
                        <div className="login-image-section">
                            <div className="image-container">
                                <Lottie
                                    animationData={loginPageLottie}
                                    loop={true}
                                    className="login-image"
                                />
                            </div>
                        </div>
                    )}
                </Paper>

                <div className="decorative-circle decorative-circle--bottom-right"></div>

                {/* Version Display */}
            </div>
            <div className="version-display">
                {versionString}
            </div>
        </div>
    );
};

export default LoginPage1;
