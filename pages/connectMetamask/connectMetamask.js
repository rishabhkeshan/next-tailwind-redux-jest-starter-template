import { useContext, useEffect, useState, useRef } from "react";
import { MetaStateContext } from "./store";

const chains = (chainId) => {
  if (!!Number(chainId) && chainId.length > 9) {
    return "local";
  }
  switch (chainId) {
    case "1":
      return "mainnet";
    case "3":
      return "ropsten";
    case "4":
      return "rinkeby";
    case "5":
      return "goerli";
    case "42":
      return "kovan";
    default:
      return `unknown`;
  }
};

const connectMetamask = () => {
  const { state, dispatch } = useContext(MetaStateContext);
  const _isMounted = useRef(true);
  const _isConnectCalled = useRef(false);
  const [provider] = useState(window.ethereum);
  useEffect(() => {
    return () => {
      _isMounted.current = false;
    };
  }, []);

  const connect = async (Web3Interface, settings = {}) => {
    if (!provider) throw Error("Metamask is not available.");
    if (!Web3Interface)
      throw Error(
        "Web3 Provider is required. You can use either ethers.js or web3.js."
      );
    if (!_isMounted.current) throw Error("Component is not mounted.");
    if (_isConnectCalled.current) throw Error("Connect method already called.");
    _isConnectCalled.current = true;

    const _web3 = new Web3Interface(
      ...(Object.keys(settings).length ? [provider, settings] : [provider])
    );

    const account = await getAccounts({ requestPermission: true });
    const chainDet = await getChainId();

    dispatch({
      type: "SET_INITALCONNECT",
      payload: { _web3, account, chainDet },
    });

    window.ethereum.on("accountsChanged", (accounts) => {
      if (!accounts.length) dispatch({ type: "SET_CONNECTED", payload: false });
      dispatch({ type: "SET_ACCOUNT", payload: accounts });
    });

    window.ethereum.on("chainChanged", (chainId) => {
      const _chainId = parseInt(chainId, 16).toString();
      const _chainInfo = { id: _chainId, name: chains(_chainId) };
      dispatch({ type: "SET_CHAIN", payload: _chainInfo });
    });

    _isConnectCalled.current = false;
  };

  const getAccounts = async (
    { requestPermission } = { requestPermission: false }
  ) => {
    if (!provider) {
      console.warn("Metamask is not available.");
      return;
    }
    try {
      const accounts = await provider.request({
        method: requestPermission ? "eth_requestAccounts" : "eth_accounts",
        params: [],
      });
      return accounts;
    } catch (error) {
      throw Error(error);
    }
  };

  const getChainId = async () => {
    if (!provider) {
      console.warn("Metamask is not available.");
      return;
    }
    try {
      const chainId = await provider.request({
        method: "eth_chainId",
        params: [],
      });
      const chainIdInString = parseInt(chainId, 16).toString();
      const _chainInfo = { id: chainIdInString, name: chains(chainIdInString) };
      return _chainInfo;
    } catch (error) {
      throw Error(error);
    }
  };

  return {
    connect,
    getAccounts,
    getChainId,
    metaState: { ...state, isAvailable: !!provider },
  };
};

export default connectMetamask;
