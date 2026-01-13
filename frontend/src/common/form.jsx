

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

function CommonForm({
  formControls,
  formData,
  setFormData,
  onSubmit,
  buttonText,
  isBtnDisabled,
  showForgotPassword,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const renderInputsByComponentType = (control) => {
    const value = formData[control.name] || "";
    const isPasswordField = control.name === "password";
    const isConfirmPasswordField = control.name === "confirmPassword";
    const showField = isPasswordField
      ? showPassword
      : isConfirmPasswordField
      ? showConfirmPassword
      : false;

    switch (control.componentType) {
      case "input":
        return (
          <div className="relative">
            <Input
              name={control.name}
              placeholder={control.placeholder}
              id={control.name}
              type={
                isPasswordField || isConfirmPasswordField
                  ? showField
                    ? "text"
                    : control.type
                  : control.type
              }
              value={value}
              onChange={(e) => handleFieldChange(control.name, e.target.value)}
              className="text-[15px] placeholder:text-[15px] pr-10"
            />
            {(isPasswordField || isConfirmPasswordField) && (
              <button
                type="button"
                onClick={() => {
                  if (isPasswordField) setShowPassword((prev) => !prev);
                  if (isConfirmPasswordField)
                    setShowConfirmPassword((prev) => !prev);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
              >
                {showField ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
        );

      case "select":
        return (
          <Select
            onValueChange={(val) => handleFieldChange(control.name, val)}
            value={value}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={control.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {control.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "textarea":
        return (
          <Textarea
            name={control.name}
            placeholder={control.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(control.name, e.target.value)}
            className="min-h-[120px]"
          />
        );

      default:
        return (
          <Input
            name={control.name}
            placeholder={control.placeholder}
            id={control.name}
            type={control.type}
            value={value}
            onChange={(e) => handleFieldChange(control.name, e.target.value)}
          />
        );
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-4">
        {formControls.map((control) => (
          <div className="grid w-full gap-1.5" key={control.name}>
            <Label
              htmlFor={control.name}
              className="mb-1 text-sm font-medium text-gray-700"
            >
              {control.label}
            </Label>
            {renderInputsByComponentType(control)}

            {showForgotPassword && control.name === "password" && (
              <div className="text-right mt-1">
                <a
                  href="/forgot-password"
                  className="text-xs text-gray-500 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        disabled={isBtnDisabled}
        type="submit"
        size="lg"
        className="mt-6 w-full bg-purple-950 hover:bg-purple-800 text-white font-medium"
      >
        {buttonText || "Submit"}
      </Button>
    </form>
  );
}

export default CommonForm;
