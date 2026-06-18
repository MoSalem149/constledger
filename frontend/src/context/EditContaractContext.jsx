import { createContext, useState } from "react";

export const ContractContext = createContext(null);

export default function EditContractContext({ children }) {
  const [data, setData] = useState({});

  const changeData = (newData) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <ContractContext.Provider value={{ data, changeData }}>
      {children}
    </ContractContext.Provider>
  );
}
