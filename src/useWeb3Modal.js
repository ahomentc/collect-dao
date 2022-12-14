import { Web3Provider } from "@ethersproject/providers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import Web3Modal from "web3modal";
const Web3 = require('web3');

// Enter a valid infura key here to avoid being rate limited
// You can get a key for free at https://infura.io/register
const INFURA_ID = "fee8c943351648ac819a52f3ee66bfbc";

const NETWORK = "mainnet";

function useWeb3Modal(config = {}) {
  const [provider, setProvider] = useState();
  const [autoLoaded, setAutoLoaded] = useState(false);
  const { autoLoad = true, infuraId = INFURA_ID, network = NETWORK } = config;

  // Web3Modal also supports many other wallets.
  // You can see other options at https://github.com/Web3Modal/web3modal
  const web3Modal = useMemo(() => {
    return new Web3Modal({
      cacheProvider: true,
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            infuraId,
          },
        },
      },
    });
  }, [infuraId, network]);

  // Open wallet selection modal.
  const loadWeb3Modal = useCallback(async () => {
    web3Modal.connect().then((newProvider) => {
      setProvider(new Web3Provider(newProvider));
    }).catch((err) => {
      // alert(err)
    })

  }, [web3Modal]);

  const logoutOfWeb3Modal = useCallback(
    async function () {
      localStorage.removeItem('profileId');
      web3Modal.clearCachedProvider();
      window.location.reload();
    },
    [web3Modal],
  );

 useEffect(() => {
   if (provider) {
     provider.on("accountsChanged", (accounts) => {
      localStorage.removeItem('profileId');
     });
   }
 }, [provider])

  // If autoLoad is enabled and the the wallet had been loaded before, load it automatically now.
  useEffect(() => {
    if (autoLoad && !autoLoaded && web3Modal.cachedProvider) {
      loadWeb3Modal();
      setAutoLoaded(true);
    }
  }, [autoLoad, autoLoaded, loadWeb3Modal, setAutoLoaded, web3Modal.cachedProvider]);

  return [provider, loadWeb3Modal, logoutOfWeb3Modal];
}

export default useWeb3Modal;