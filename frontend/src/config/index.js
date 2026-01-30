export const registerFormControls = [
  {
    name: "businessName",
    label: "Business Name",
    placeholder: "Enter your business name",
    componentType: "input",
    type: "text",
  },
  {
    name: "email",
    label: "Email",
    placeholder: "Enter your email",
    componentType: "input",
    type: "email",
  },
  {
    name: "password",
    label: " Create Password",
    placeholder: "At least 8 characters",
    componentType: "input",
    type: "password",
  },

 {
  name: "businessType",
  label: "Business Type",
  placeholder: "Select your business type",
  componentType: "select",
  options: [
    { label: "Retail Store", value: "retail" },
    { label: "Freelancer", value: "freelancer" },
    { label: "Online Vendor", value: "online_vendor" },
    { label: "Service Provider", value: "service" },
    { label: "Other", value: "other" },
  ]
}

];

export const loginFormControls = [
  {
    name: "email",
    label: "Email",
    placeholder: "Enter your email",
    componentType: "input",
    type: "email",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Enter your password",
    componentType: "input",
    type: "password",
  },
];

export const KREDDY_CONFIG = {
    // Kreddy WhatsApp Business Number
    PHONE_NUMBER: "2347071238658", 
    
    // The link format for deep linking
    getLink: (text = "Hi Kreddy") => `https://wa.me/2347071238658?text=${encodeURIComponent(text)}`
};
