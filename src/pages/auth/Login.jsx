// File: Login.jsx
import { useForm } from "react-hook-form";
import axios from "axios";
import { PORT } from "../../utils/constants";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Import jwt-decode if not already imported

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm();

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${PORT}/auth/login`, data);
      if (response.status === 200 || response.status === 201) {
        const { access_token } = response.data;

        // Save the access token to localStorage
        localStorage.setItem("access_token", access_token);

        // Decode the access_token to extract `sub` and `role`
        const decoded = jwtDecode(access_token);
        const userId = decoded.sub; // Adjust if `sub` is named differently in your JWT
        const userRole = decoded.role; // Adjust if `role` is named differently in your JWT

        // Save `id` and `role` in localStorage
        localStorage.setItem("id", userId);
        localStorage.setItem("role", userRole);

        console.log("Login Successful:", response.data);
        console.log("Decoded Token:", decoded);

        // Navigate to the profile page
        navigate("/profile");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        reset();
        setError("username", {
          type: "manual",
          message: "Invalid username or password",
        });
      } else {
        console.error("Login Error:", error);
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="w-1/2  flex flex-col justify-start items-center">
        <h1 className="text-xl font-semibold my-6">
          Curriculum Advising Management System
        </h1>
        <img src="/unc.png" alt="UNC Logo" className="w-20 h-20 mb-20" />
        <img src="/logo.png" alt="Logo" className="w-96 h-96" />
      </div>

      {/* Right Panel */}
      <div className="w-1/2 bg-gray-200 flex flex-col justify-center px-8">
        <div className="max-w-sm mx-auto w-full">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            Welcome Back
          </h2>
          <p className="text-gray-600 mb-6">Please enter your details</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Dropdown */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Login as:
              </label>
              <select
                id="role"
                {...register("role", { required: "Please select a role" })}
                className={`mt-1 w-full p-2 border rounded bg-white ${
                  errors.role ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select your role</option>
                <option value="DEAN">Dean</option>
                <option value="HEAD">Program Head</option>
                <option value="STUDENT">Student</option>
                <option value="COACH">Coach</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm">{errors.role.message}</p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username:
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                {...register("username", { required: "Username is required" })}
                className={`mt-1 w-full p-2 border rounded ${
                  errors.username ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.username && (
                <p className="text-red-500 text-sm">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password:
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                {...register("password", { required: "Password is required" })}
                className={`mt-1 w-full p-2 border rounded ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot your password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
            >
              Log in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
