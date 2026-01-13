import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Configure axios defaults
axios.defaults.withCredentials = true;

const initialState = {
  business: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,
  message: null
};

// Register Business
export const registerBusiness = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/register`,
        formData
      );
      localStorage.setItem("emailForVerification", formData.email);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

// Login Business
export const loginBusiness = createAsyncThunk(
  "auth/login",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
        formData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

// Verify Email
export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (code, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-email`,
        { code }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Verification failed"
      );
    }
  }
);

// Resend Verification Code
export const resendVerificationCode = createAsyncThunk(
  "auth/resendVerificationCode",
  async (_, { rejectWithValue }) => {
    try {
      const email = localStorage.getItem("emailForVerification");
      if (!email) throw new Error("No email found for verification");
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/resend-verification`,
        { email }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to resend code"
      );
    }
  }
);

// Forgot Password
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/forgot-password`,
        { email }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send reset email"
      );
    }
  }
);

// Reset Password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/reset-password/${token}`,
        { password }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reset password"
      );
    }
  }
);

// Logout
export const logoutBusiness = createAsyncThunk(
  "auth/logoutBusiness",
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`);
      return {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Logout failed"
      );
    }
  }
);

// Check Auth
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/check-auth`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Authentication check failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register Business
      .addCase(registerBusiness.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerBusiness.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(registerBusiness.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Login Business
      .addCase(loginBusiness.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginBusiness.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.business = action.payload.business;
      })
      .addCase(loginBusiness.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.message = "Email verified successfully";
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Resend Verification Code
      .addCase(resendVerificationCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendVerificationCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(resendVerificationCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutBusiness.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutBusiness.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.business = null;
      })
      .addCase(logoutBusiness.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.isAuthenticated = true;
        state.business = action.payload.business;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isCheckingAuth = false;
        state.isAuthenticated = false;
        state.business = null;
      });
  }
});

export const { clearError, clearMessage } = authSlice.actions;
export default authSlice.reducer;