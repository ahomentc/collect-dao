import React, { useEffect, useState, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import client from '../apollo.js';
import InputAdornment from "@material-ui/core/InputAdornment";

import {
    getDAOAddress,
    getDAOcollectNFTAddress,
    getDAOWrappedCollectNFTAddress
} from "../FirebaseInteractions.js"

import {
    NftsDocument,
} from '../LensAPI/generated.ts';

import SimplePublication from "./SimplePublication.js";
import SimpleCollect from "./SimpleCollect.js";

const Publication = (props) => {

    const location = useLocation();
    const [profileId, setProfileId] = useState()
    const [pubId, setPubId] = useState()
    const [nfts, setNfts] = useState()
    const [stakedNfts, setStakedNfts] = useState()
    const accountRef = useRef()
    const fetchedNftsRef = useRef(false)
    const finishedFetchingNfts = useRef(false)
    const finishedFetchingWrappedNfts = useRef(false)
    const [govLink, setGovLink] = useState()
    const [collectAddress, setCollectAddress] = useState()
    const [wrappedCollectAddress, setWrappedCollectAddress] = useState()
    const collectAddressRef = useRef()
    const wrappedCollectAddressRef = useRef()

    useEffect(() => {
        if (location.pathname) {
            const urlArr = location.pathname.substring(1).split('/')
            if (urlArr.length > 1) {
                const publication = urlArr[1]
                const publication_arr = publication.split('_')
                if (publication_arr.length > 1) {
                    setProfileId(publication_arr[0])                    
                    setPubId(publication_arr[1])
                }
            }
        }
    }, [location.pathname])

    useEffect(() => {
        if (profileId && pubId) {
            getDAOAddress(profileId, pubId, (govContractAddress) => {
                setGovLink("https://www.tally.xyz/governance/eip155:137:" + govContractAddress)
            })
            getDAOcollectNFTAddress(profileId, pubId, (_collectAddress) => {
                setCollectAddress(_collectAddress)
                collectAddressRef.current = _collectAddress
            })
            getDAOWrappedCollectNFTAddress(profileId, pubId, (_collectAddress) => {
                setWrappedCollectAddress(_collectAddress)
                wrappedCollectAddressRef.current = _collectAddress
            })
            
        }
    }, [profileId, pubId])

    useEffect(() => {
        if (props.account) {
            accountRef.current = props.account
        }
    }, props.account)

    // Get the user's tokens belonging to this
    // Have a button for each of them to stake if not already staked
    // collectAddress
    const getUsersNfts = async (request) => {
        const result = await client.query({
          query: NftsDocument,
          variables: {
            request,
          },
        });
      
        return result.data.nfts;
      };
      const usersNfts = async (_address, _collectAddress) => {
        const address = _address
        const collectAddress_ = _collectAddress
        const result = await getUsersNfts({
          ownerAddress: address,
          contractAddress: collectAddress_,
          chainIds: [137],
        });
        return result;
      };
      (async () => {
        setTimeout(async () => {
          if (accountRef.current && collectAddressRef.current && !fetchedNftsRef.current) {
            fetchedNftsRef.current = true
            const nftsRetrieved = await usersNfts(accountRef.current, collectAddressRef.current);
            if (nftsRetrieved.items) {
              const _nfts = nftsRetrieved.items
              if (_nfts.length > 0) {
                setNfts(_nfts)
              }
            }
            finishedFetchingNfts.current = true
            const stakedNftsRetrieved = await usersNfts(accountRef.current, wrappedCollectAddressRef.current);
            if (stakedNftsRetrieved.items) {
              const _nfts = stakedNftsRetrieved.items
              if (_nfts.length > 0) {
                setStakedNfts(_nfts)
              }
            }
            finishedFetchingWrappedNfts.current = true
          }
        }, 100)
      })();

    return (
        <>
            <div style={{ height: "10vh" }} ></div> {/* padding */}
            <Grid container>
                <Grid item xs={12}
                    style={{
                        display: 'flex', 
                        alignItems: 'baseline', 
                        justifyContent: 'center', 
                    }} spacing={2} columns={{ xs: 12 }}>
                    <div style={{
                        marginLeft: "auto",
                        marginTop: "10px",
                        marginRight: "auto",
                        width: window.innerWidth < 400 ? "95%" : "400px",
                    }}>
                        <SimplePublication profileId={profileId} pubId={pubId} />
                    </div>
                </Grid>
                <Grid item xs={12}
                    style={{
                        display: 'flex', 
                        alignItems: 'baseline', 
                        justifyContent: 'center', 
                        marginLeft: "auto",
                        marginTop: "30px",
                        marginRight: "auto",
                        maxWidth: window.innerWidth < 700 ? "95%" : "1000px",
                    }} spacing={2} columns={{ xs: 12 }}>
                    <Button variant="outlined" onClick={() => window.open(govLink)} style={{
                            textTransform: "none",
                            color: "#423bff",
                            borderColor: "#423bff",
                            borderRadius: "10px",
                            width: window.innerWidth < 300 ? "95%" : "300px",
                        }}>
                        Open DAO
                    </Button>
                </Grid>
                <Grid item xs={12}
                    style={{
                        display: 'flex', 
                        alignItems: 'baseline', 
                        justifyContent: 'center', 
                        marginLeft: "auto",
                        marginTop: "30px",
                        marginBottom: "10px",
                        marginRight: "auto",
                        maxWidth: window.innerWidth < 700 ? "95%" : "1000px",
                        fontWeight: "bold"
                    }} container spacing={2} columns={{ xs: 2, sm: 10, md: 12 }}>
                    <div>
                        Collects you own:
                    </div>
                </Grid>
                { finishedFetchingWrappedNfts.current ?
                    stakedNfts &&
                        <Grid item xs={12}
                            style={{
                                display: 'flex', 
                                alignItems: 'baseline', 
                                justifyContent: 'center', 
                            }} spacing={2} columns={{ xs: 12 }}>
                            {stakedNfts.map((nftInfo) => (
                                <div style={{
                                    marginLeft: "auto",
                                    marginTop: "10px",
                                    marginRight: "auto",
                                    width: window.innerWidth < 400 ? "95%" : "400px",
                                }}>
                                    <SimpleCollect provider={props.provider} account={props.account} profileId={profileId} pubId={pubId} nftInfo={nftInfo} collectAddress={collectAddress} wrappedCollectAddress={wrappedCollectAddress} />
                                </div>
                            ))}
                        </Grid>
                :
                    <></>
                }
                { finishedFetchingNfts.current ?
                    nfts &&
                        <Grid item xs={12}
                            style={{
                                display: 'flex', 
                                alignItems: 'baseline', 
                                justifyContent: 'center', 
                            }} spacing={2} columns={{ xs: 12 }}>
                            {nfts.map((nftInfo) => (
                                <div style={{
                                    marginLeft: "auto",
                                    marginTop: "10px",
                                    marginRight: "auto",
                                    width: window.innerWidth < 400 ? "95%" : "400px",
                                }}>
                                    <SimpleCollect provider={props.provider} account={props.account} profileId={profileId} pubId={pubId} nftInfo={nftInfo} collectAddress={collectAddress} wrappedCollectAddress={wrappedCollectAddress} />
                                </div>
                            ))}
                        </Grid>
                :
                    <Grid item xs={12}
                        style={{
                            display: 'flex', 
                            alignItems: 'baseline', 
                            justifyContent: 'center',
                            marginTop: "30px" 
                        }} spacing={2} columns={{ xs: 12 }}>
                        <CircularProgress />
                    </Grid>
                }

            </Grid>
            <div style={{ height: "20vh" }} ></div> {/* padding */}
        </>
    )
}

export default Publication;