
import { configureStore } from '@reduxjs/toolkit';
import authReducer from "./authSlice/index"

const store = configureStore({
  reducer: {
   auth: authReducer,
  }
});

export default store;