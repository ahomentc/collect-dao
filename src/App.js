import Home from './Home/Home.js';
import './App.css';
import React, { useEffect, useState, useRef } from "react";
import { TopAppBar } from './TopAppBar.js'
import { Router, Routes, Route, Link } from "react-router-dom";
import useWeb3Modal from "./useWeb3Modal";
import client from './apollo.js';

import {
  ProfileDocument, 
  SingleProfileQueryRequest,
  NftsDocument,
  NfTsRequest,
  DefaultProfileDocument, 
  DefaultProfileRequest
} from './LensAPI/generated.ts';

function App() {

  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();
  const accountRef = useRef()
  const [account, setAccount] = useState()
  const fetchedProfileId = useRef(false)
  const fetchedDefaultProfileId = useRef(false)
  const [profileId, setProfileId] = useState()

  useEffect(() => {
    async function fetchAccount() {
        try {
            if (!provider) {
                return;
            }
            const accounts = await provider.listAccounts();
            accountRef.current = accounts[0]
            setAccount(accounts[0])
        } catch (err) {
            console.error(err);
        }
    }
    if (provider) {
        fetchAccount();
    }
  }, [provider]);

  // ----- Fetch the user's profile NFTs and get the first one -----
  const getUsersNfts = async (request) => {
    const result = await client.query({
      query: NftsDocument,
      variables: {
        request,
      },
    });
  
    return result.data.nfts;
  };
  const usersNfts = async (_address) => {
    const address = _address
    const result = await getUsersNfts({
      ownerAddress: address,
      contractAddress: '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d',
      chainIds: [137],
    });
    return result;
  };
  (async () => {
    setTimeout(async () => {
      if (accountRef.current && !fetchedProfileId.current) {
        fetchedProfileId.current = true
        const profileNFTs = await usersNfts(accountRef.current);
        if (profileNFTs.items) {
          const nfts = profileNFTs.items
          if (nfts.length > 0) {
            const profileNFT = nfts[0]
            if (profileNFT.tokenId) {
              const _profileId = profileNFT.tokenId
              if (!profileId) {
                setProfileId(_profileId)
                localStorage.setItem("profileId", _profileId);
              }
            }
          }
        }
      }
    }, 100)
  })();
  useEffect(() => {
    const _profileId = localStorage.getItem("profileId")
    if (_profileId && _profileId !== undefined) {
      setProfileId(_profileId)
    }
  }, [])
  // -------------------

  // ----- Try to get the default profile -----
  // const getDefaultProfileRequest = async (request) => {
  //   const result = await client.query({
  //     query: DefaultProfileDocument,
  //     variables: {
  //       request,
  //     },
  //   });
  //   return result.data.defaultProfile;
  // };
  
  // const getDefaultProfile = async (_address) => {
  //   const address = _address
  //   const result = await getDefaultProfileRequest({ address });
  //   console.log('profiles: result', result);
  //   return result;
  // };

  // (async () => {
  //   setTimeout(async () => {
  //     if (accountRef.current && !fetchedDefaultProfileId.current) {
  //       fetchedDefaultProfileId.current = true
  //       const defaultProfile = await getDefaultProfile(accountRef.current);
  //     }
  //   }, 100)
  // })();

  // ----- Get profile from profileId -----

  // const getProfileIdFromAddress = async (request) => {
  //     const result = await client.query({
  //       query: ProfileDocument,
  //       variables: {
  //         request,
  //       },
  //     });
  //     return result.data.profile;
  // };
    
  // const profileIdFromAddress = async (_address) => {
  //     const address = _address
  //     const result = await getProfileIdFromAddress({ address });
  //     return result;
  // };

  // Get the lens profile ID
  useEffect(() => {
      if (account) {
          // alert(account)
      }
  }, [account])

  return (
    <>
      <div style={{margin: "auto", overflowX: "hidden", width: "100%", zIndex: '1000'}}>
          {/* Top Bar*/}
          <TopAppBar provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />

      </div>
      <Routes>
        <Route path="/" element={<Home provider={provider} account={account} profileId={profileId} />} />
      </Routes>
    </>
  );
}

export default App;
