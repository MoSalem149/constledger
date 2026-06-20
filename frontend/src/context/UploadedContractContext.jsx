import { createContext, useState } from "react";

export const UContractContext = createContext(null);

export default function UploadedContractContext({ children }) {
  const [contractData, setContractData] = useState({});

  return (
    <UContractContext.Provider
      value={{
        contractData,
        setContractData,
      }}
    >
      {children}
    </UContractContext.Provider>
  );
}
