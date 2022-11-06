import React, { useEffect, useState, useRef, useId } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import userImg from '../user.png';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import client from '../apollo.js';
import InputAdornment from "@material-ui/core/InputAdornment";
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';

import {
    PublicationDocument, 
} from '../LensAPI/generated.ts';

import {
    isTokenStaked,
    firebaseFunctionsUrl
} from "../FirebaseInteractions.js"

import {
    wrapCollect,
    approveWrapperCollectContract
} from "../ContractInteractions.js"

const SimpleCollect = (props) => {

    const profileIdRef = useRef()
    const pubIdRef = useRef()
    const fetchedInfo = useRef(false)
    const [content, setContent] = useState()
    const [avi, setAvi] = useState(userImg)
    const [handle, setHandle] = useState()
    const [tokenId, setTokenId] = useState()
    const [collectAddress, setCollectAddress] = useState()
    const [isStaked, setIsStaked] = useState()
    const [fetchedIsStaked, setFetchedIsStaked] = useState(false)
    const [stakeStarted, setStakeStarted] = useState(false)

    useEffect(() => {
        if (props.profileId) {
            profileIdRef.current = props.profileId
        }
    }, props.profileId)

    useEffect(() => {
        if (props.pubId) {
            pubIdRef.current = props.pubId
        }
    }, props.pubId)

    useEffect(() => {
        if (props.nftInfo) {
            setCollectAddress(props.nftInfo.contractAddress)
            setTokenId(props.nftInfo.tokenId)
        }
    }, [props.nftInfo])

    useEffect(() => {
        if (props.profileId && props.pubId && tokenId) {
            isTokenStaked(props.profileId, props.pubId, tokenId, (_isStaked) => {
                setFetchedIsStaked(true)
                setIsStaked(_isStaked)
            })
        }
    }, [props.profileId, props.pubId, tokenId])

    const getPublicationRequest = async (request) => {
        const result = await client.query({
          query: PublicationDocument,
          variables: {
            request,
          },
        });
      
        return result.data.publication;
    };

    function d2h(d) {
        var h = (d).toString(16);
        return h.length % 2 ? '0' + h : h;
    }
      
    const getPublication = async (profileId, pubId) => {
        var hexProfileId;
        var hexPubId;
        hexProfileId = "0x" + d2h(parseInt(profileId))
        hexPubId = "0x" + d2h(parseInt(pubId))
        const publicationId = hexProfileId + "-" + hexPubId
        const result = await getPublicationRequest({ publicationId: publicationId });
        console.log('publication: result', result);
        return result;
      };
      (async () => {
        setTimeout(async () => {
          if (profileIdRef.current && pubIdRef.current) {
            if (fetchedInfo.current == false) {
                fetchedInfo.current = true
                const publication = await getPublication(profileIdRef.current, pubIdRef.current);
                const metadata = publication.metadata
                const _content = metadata.content
                setContent(_content)
                if (publication && publication.profile && publication.profile.picture && publication.profile.picture.original && publication.profile.picture.original.url) {
                    var url = publication.profile.picture.original.url
                    if(url.substring(0,7) == "ipfs://") {
                        url = "https://lensdao.infura-ipfs.io/ipfs/" + url.substring(7)
                    }
                    else if (url.includes("ipfs.infura.io")) {
                        url = url.replace("ipfs.infura.io", "lensdao.infura-ipfs.io")
                    }
                    setAvi(url)
                }
                if (publication && publication.profile) {
                    setHandle(publication.profile.handle)
                }
            }
          }
        }, 100)
    })();

    const stake = () => {
        if (!tokenId) {
            alert("Err: Token id not found")
            return
        }
        setStakeStarted(true)
        var gotFirstReceipt = false

        // Need to approve the wrappedCollectAddress first
        approveWrapperCollectContract(props.provider, props.account, props.collectAddress, props.wrappedCollectAddress, (hash) => {
            alert("Approving Staking Transaction: " + hash)
          }, (receipt) => {
            if (receipt.status) {
                wrapCollect(props.provider, props.account, props.wrappedCollectAddress, tokenId, (staking_hash) => {
                    alert("Staking Transaction: " + staking_hash)
                }, async (receipt) => {  
                    if (receipt.status && !gotFirstReceipt) {
                        gotFirstReceipt = true

                        // Save in database
                        var messageForServer = {
                            profileId: props.profileId,
                            pubId: props.pubId,
                            tokenId: tokenId,
                        };
                        const messageJSON = JSON.stringify(messageForServer);
                        var messageBuff = new Buffer(messageJSON);
                        var encodedMessage = messageBuff.toString('base64');
                    
                        const url = firebaseFunctionsUrl + "/TokenStaked?params=" + encodedMessage
                        const response = await fetch(url);
                        const data = await response.json();

                        setStakeStarted(false)

                        setTimeout(() => {
                            window.location.reload()
                        }, 5000)
                    }
                }, (error) => {
                    console.log(error)
                })
            }
          }, (error) => {
            alert("Error when staking token")
            // error
        })
    }

    return (
        <Paper elevation={0} 
            sx={{
                width: "100%",
                padding: "5px",
                borderStyle: "solid",
                borderRadius: "10px",
                borderColor: "#ddd",
                borderWidth: "1px",
                boxShadow: "0px 0px 100px 5px #ffffff60",
                ':hover': {
                    boxShadow: "0px 0px 50px 5px #ffffff60"
                }
            }}>
            { handle && content ?
                <>
                    <ListItem>
                        <>
                            <ListItemAvatar style={{ cursor: "pointer"}} >
                                <img 
                                    style={{ width: "40px", height: "40px", borderRadius: "25px", objectFit: "cover" }} 
                                    onError={(ev) => {ev.target.src = userImg}} 
                                    src={avi} 
                                />
                            </ListItemAvatar>
                            <ListItemText>
                                {handle}
                            </ListItemText>
                        </>
                    </ListItem>
                    <ListItem style={{paddingTop: "0px"}}>
                        <div style={{padding: "5px", paddingTop: "0px", maxWidth: "100%"}}>
                            {content}
                        </div>
                    </ListItem>
                    <ListItem style={{paddingTop: "0px"}}>
                        <div style={{
                            padding: "0px", 
                            marginTop: "10px", 
                            width: "100%",
                            backgroundColor: "#ddd",
                            height: "1px"
                        }}>
                        </div>
                    </ListItem>
                    <ListItem style={{
                            paddingTop: "10px", 
                            display: 'flex', 
                            alignItems: 'baseline', 
                            justifyContent: 'center', 
                        }}>
                        <div>
                            Collect # {tokenId}
                        </div>
                    </ListItem>
                    { fetchedIsStaked ?
                        <>
                            <ListItem style={{
                                paddingTop: "5px", 
                                display: 'flex', 
                                alignItems: 'baseline', 
                                justifyContent: 'center', 
                            }}>
                                { isStaked ?
                                    <Button disabled variant="outlined" style={{
                                        textTransform: "none"
                                    }}>
                                        Unstake
                                    </Button>
                                :
                                     !stakeStarted ?
                                        <Button 
                                        onClick={stake}
                                        variant="outlined"
                                        style={{
                                            textTransform: "none"
                                        }}>
                                            Stake
                                        </Button>
                                    :
                                        <CircularProgress />
                                }
                                
                            </ListItem>
                            { !isStaked ?
                                <ListItem style={{
                                    paddingTop: "2px", 
                                    display: 'flex', 
                                    alignItems: 'baseline', 
                                    justifyContent: 'center', 
                                }}>
                                    <div style={{
                                        fontSize: "12px",
                                        color: "#aaa"
                                    }}>
                                        You need to stake your collect to vote
                                    </div>
                                </ListItem>
                                : <></>
                            }
                        </>
                        :
                            <ListItem style={{
                                paddingTop: "5px", 
                                display: 'flex', 
                                alignItems: 'baseline', 
                                justifyContent: 'center', 
                            }}>
                                <CircularProgress />
                            </ListItem>
                    }

                </>
            :
                <div style={{
                    display: 'flex', 
                    alignItems: 'baseline', 
                    justifyContent: 'center', 
                }}>
                    <CircularProgress />
                </div>
            }
        </Paper>
    )
}

export default SimpleCollect;