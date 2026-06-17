import { createContext, useState } from "react";

export const UContractContext = createContext(null);

export default function UploadedContractContext({ children }) {
  const [contractData, setContractData] = useState({});

  const saveContractData = (data) => {
    setContractData(data);
  };

  return (
    <UContractContext.Provider value={{ contractData, saveContractData }}>
      {children}
    </UContractContext.Provider>
  );
}
