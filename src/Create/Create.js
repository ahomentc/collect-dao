import React, { useEffect, useState, useRef } from "react";
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import client from '../apollo.js';
import InputAdornment from "@material-ui/core/InputAdornment";

import {
    createTimelockContract,
    createWrappedCollectContract,
    createGovContract,
    publishPost,
    collectPost
} from "../ContractInteractions.js"

import {
    firebaseFunctionsUrl
} from "../FirebaseInteractions.js"

import {
    ProfileDocument, 
    SingleProfileQueryRequest,
  } from '../LensAPI/generated.ts';

const Web3 = require('web3');
const ipfs = require("ipfs-http-client")
var crypto = require('crypto');

const Create = (props) => {
    const [started, setStarted] = useState(false)
    const [finishedCreation, setFinishedCreation] = useState(false)
    const [postText, setPostText] = useState("");
    const [priceText, setPriceText] = useState(1)
    const [collectLimit, setCollectLimit] = useState(100)

    // DAO Info:
    const [wrappedCollectAddressInfo, setWrappedCollectAddressInfo] = useState()
    const [wrappedCollectBlocknumberInfo, setWrappedCollectBlocknumberInfo] = useState()
    const [govAddressInfo, setGovAddressInfo] = useState()
    const [govBlocknumberInfo, setGovBlocknumberInfo] = useState()
    const [profileIdInfo, setProfileIdInfo] = useState()
    const [pubIdInfo, setPubIdInfo] = useState()

    const web3Provider = "https://polygon-mainnet.g.alchemy.com/v2/5MNL9hFB1ZUt4GfvpvDEFho2iN1eDinP"

    const collectModule = "0xEF13EFa565FB29Cd55ECf3De2beb6c69bD988212" // LimitedFeeCollectModule
    const erc20Token = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270" // wmatic

    function d2h(d) {
        var h = (d).toString(16);
        return h.length % 2 ? '0' + h : h;
    }

    const getProfileRequest = async (request) => {
        const result = await client.query({
          query: ProfileDocument,
          variables: {
            request,
          },
        });
        return result.data.profile;
      };
      
    const getProfile = async (_profileId) => {
        const profileId = "0x" + d2h(parseInt(_profileId))
        const request = { profileId: profileId };
        const profile = await getProfileRequest(request);      
        return profile;
    };

    const createTimelock = async (cb) => {
        createTimelockContract(props.provider, props.account, (hash) => {
            alert("Timelock contract creation pending: " + hash)
        }, (receipt) => {  
            if (receipt.status) {
                const contractAddress = receipt.contractAddress
                cb(contractAddress)
            }
        }, (error) => {
            console.log(error)
        })
    }

    const createGov = async (wrappedCollectAddress, timelockAddress, cb) => {
        createGovContract(props.provider, props.account, wrappedCollectAddress, timelockAddress, (hash) => {
            alert("Gov contract creation pending: " + hash)
        }, (receipt) => {  
            if (receipt.status) {
                const contractAddress = receipt.contractAddress
                const blockNumber = receipt.blockNumber
                cb({contractAddress: contractAddress, blockNumber: blockNumber})
            }
        }, (error) => {
            console.log(error)
        })
    }

    const createWrappedCollect = async (collectContract, cb) => {
        createWrappedCollectContract(props.provider, props.account, collectContract, (hash) => {
            alert("Wrapped collect contract creation pending: " + hash)
        }, (receipt) => {  
            if (receipt.status) {
                const contractAddress = receipt.contractAddress
                const blockNumber = receipt.blockNumber
                cb({contractAddress: contractAddress, blockNumber: blockNumber})
            }
        }, (error) => {
            console.log(error)
        })
    }

    const createPost = async (timelockAddress, cb) => {
        if (!props.profileId) {
            alert("Failed to fetch Lens Profile")
            return
        }

        const profile = await getProfile(props.profileId)
        if (!profile) {
            alert("Failed to fetch Lens Profile")
            return
        }
        const handle = profile.handle

        var web3 = new Web3(new Web3.providers.HttpProvider(web3Provider));
        const referenceModule = "0x0000000000000000000000000000000000000000"
        const referenceModuleInitData = "0x0000000000000000000000000000000000000000000000000000000000000000"
        const limit = collectLimit.toString()
        const mirrorPercentage = 0
        var price = (web3.utils.toWei(priceText.toString(), 'ether')).toString()
        if (parseFloat(priceText) === 0) {
            price = (web3.utils.toWei("0.01", 'ether')).toString()
        }
        const collectModuleInitData = web3.eth.abi.encodeParameters(
            ['uint256', 'uint256', 'address', 'address', 'uint16', 'bool'], 
            [limit, price, erc20Token, timelockAddress, mirrorPercentage, false]
        );

        const projectId = '2H7QnLkLc8z9mg68fuLwIfhZsNQ'
        const projectSecret = '8c7e3ff4fa8c8d12cc5fe0a930ff12a6'
        const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')
        const client = ipfs.create({
            host: 'ipfs.infura.io',
            port: 5001,
            protocol: 'https',
            headers: {
                authorization: auth
            }
        })

        var dict = new Object();
        dict["version"] = "1.0.0"
        dict["metadata_id"] = crypto.createHash('md5').update(Math.floor(Math.random() * 100).toString()).digest('hex')
        dict["description"] = postText
        dict["content"] = postText
        dict["external_url"] = null
        dict["name"] = "Post by @" + handle
        dict["attributes"] = [{"traitType":"string","key":"type","value":"post"}]
        dict["appId"] = "LensDAO"
        const json = JSON.stringify(dict)

        try {
            const added = await client.add(json)
            const cid = added.path
            const url = "https://lensdao.infura-ipfs.io/ipfs/" + cid

            var vars = new Object();
            vars["profileId"] = props.profileId
            vars["contentURI"] = url
            vars["collectModule"] = collectModule
            vars["collectModuleInitData"] = collectModuleInitData
            vars["referenceModule"] = referenceModule
            vars["referenceModuleInitData"] = referenceModuleInitData

            publishPost(props.provider, props.account, vars, (hash) => {
                alert("Publication transaction pending: " + hash)
              }, (receipt) => {
                // receipt
      
                if (receipt.status) {      
                    const logs = receipt.logs
                    if (logs && logs.length > 0) {
                        const erc721Log = logs[0]
                        const topics = erc721Log.topics
                        if (topics && topics.length == 3) {
                            const profileIdHex = topics[1]
                            const pubIdHex = topics[2]
                            const profileId = parseInt(profileIdHex, 16).toString()
                            const pubId = parseInt(pubIdHex, 16).toString()
                            setProfileIdInfo(profileId)
                            setPubIdInfo(pubId)
                            cb({profileId: profileId, pubId: pubId, contractAddress: receipt.contractAddress})
                        }
                    }
                }
            }, (error) => {
                // error
                setStarted(false)
                // alert(error)
            })

        } catch (error) {
            console.log('Error uploading: ', error)
        }
    }

    const collectPub = (profileId, pubId, cb) => {
        var web3 = new Web3(new Web3.providers.HttpProvider(web3Provider));
        var price = (web3.utils.toWei(priceText.toString(), 'ether')).toString()
        if (parseFloat(priceText) === 0) {
            price = (web3.utils.toWei("0.01", 'ether')).toString()
        }
        collectPost(props.provider, props.account, profileId, pubId, collectModule, erc20Token, price, 
        (hash) => {
            // transaction hash
            alert("Approve ERC20 transaction pending")
            },
        (hash) => {
            // transaction hash
            alert("Collect transaction pending")
        }, (receipt) => {
            // receipt
            if (receipt.status) {
                console.log(receipt)

                setTimeout(() => {
                    const logs = receipt.logs
                    if (logs && logs.length > 1) {
                        const erc721Log = logs[1]
                        console.log(erc721Log)
                        const collectAddress = erc721Log.address
                        cb(collectAddress)
                    }
                }, [5000])
            }
        }, (error) => {
            if (typeof error  === 'string' && error.includes("low_balance")) {
                alert("Your balance is too low to collect")
            }
        })
    }

    const submit = () => {
        if (!props.provider || !props.account) {
            alert("Please connect wallet")
            return
        }
        setStarted(true)

        createTimelock((timelock_contract_address) => {
            createPost(timelock_contract_address, (collect_obj) => {
                const profileId = collect_obj.profileId
                const pubId = collect_obj.pubId
                collectPub(profileId, pubId, (collectContract) => {
                    createWrappedCollect(collectContract, (wrappedCollectObj) => {
                        const wrappedCollectAddress = wrappedCollectObj.contractAddress
                        const wrappedCollectBlocknumber = wrappedCollectObj.blockNumber
                        createGov(wrappedCollectAddress, timelock_contract_address, async (govObj) => {
                            const govContractAddress = govObj.contractAddress
                            const govBlocknumber = govObj.blockNumber

                            setWrappedCollectAddressInfo(wrappedCollectAddress)
                            setWrappedCollectBlocknumberInfo(wrappedCollectBlocknumber)
                            setGovAddressInfo(govContractAddress)
                            setGovBlocknumberInfo(govBlocknumber)

                            // Save in database
                            var messageForServer = {
                                profileId: profileId,
                                pubId: pubId,
                                collectAddress: collectContract,
                                wrappedCollectAddress: wrappedCollectAddress,
                                wrappedCollectBlocknumber: wrappedCollectBlocknumber,
                                govContractAddress: govContractAddress,
                                govBlocknumber: govBlocknumber
                            };
                            const messageJSON = JSON.stringify(messageForServer);
                            var messageBuff = new Buffer(messageJSON);
                            var encodedMessage = messageBuff.toString('base64');
                        
                            const url = firebaseFunctionsUrl + "/DaoCreated?params=" + encodedMessage
                            const response = await fetch(url);
                            const data = await response.json();
                        
                            setFinishedCreation(true)
                            setStarted(false)
                        })
                    })
                })
            })
        })
    }

    return (
        <>
            <div style={{ height: "10vh" }} ></div> {/* padding */}
            <Grid container>
                <Grid item xs={12}
                    style={{
                        display: 'flex', 
                        alignItems: 'baseline', 
                        justifyContent: 'center', 
                        marginLeft: "auto",
                        marginTop: "10px",
                        marginRight: "auto",
                        maxWidth: window.innerWidth < 700 ? "95%" : "1000px",
                    }} container spacing={2} columns={{ xs: 2, sm: 10, md: 12 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: "10px" }}>
                        <TextField
                            size="small"
                            multiline
                            value={postText}
                            onInput={e => setPostText(e.target.value)}
                            rows={4}
                            placeholder="Describe your DAO"
                            variant="outlined"
                            sx={{
                                color: "#000",
                                fontSize: "16px",
                                marginRight: "5px",
                                width: "400px",
                                maxWidth: "100%",
                                boxShadow: "none"
                            }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12}
                    style={{
                        display: 'flex', 
                        alignItems: 'baseline', 
                        justifyContent: 'center', 
                        marginLeft: "auto",
                        marginTop: "10px",
                        marginRight: "auto",
                        maxWidth: window.innerWidth < 700 ? "95%" : "1000px",
                    }} container spacing={2} columns={{ xs: 2, sm: 10, md: 12 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: "10px" }}>
                        <span style={{
                            marginTop: "10px",
                            marginRight: "10px",
                            color: "#888"
                        }}>
                            Price:
                        </span>
                        <TextField
                            size="small"
                            value={priceText}
                            onChange={e => setPriceText(e.target.value)} 
                            variant="outlined"
                            sx={{
                                maxWidth: "150px",
                                borderRadius: "10px",
                                color: "#000",
                                fontSize: "16px",
                                marginRight: "5px"
                            }}
                            InputProps={{
                                shrink: true,
                                endAdornment: <InputAdornment position="end">WMATIC</InputAdornment>,
                            }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12}
                    style={{
                        display: 'flex', 
                        alignItems: 'baseline', 
                        justifyContent: 'center', 
                        marginLeft: "auto",
                        marginTop: "10px",
                        marginRight: "auto",
                        maxWidth: window.innerWidth < 700 ? "95%" : "1000px",
                    }} container spacing={2} columns={{ xs: 2, sm: 10, md: 12 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: "10px" }}>
                        <span style={{
                            marginTop: "10px",
                            marginRight: "10px",
                            color: "#888"
                        }}>
                            Collect Limit:
                        </span>
                        <TextField
                            size="small"
                            value={collectLimit}
                            onChange={e => setCollectLimit(e.target.value)} 
                            variant="outlined"
                            sx={{
                                maxWidth: "150px",
                                borderRadius: "10px",
                                color: "#000",
                                fontSize: "16px",
                                marginRight: "5px"
                            }}
                            InputProps={{
                                shrink: true,
                                endAdornment: <InputAdornment position="end">collects</InputAdornment>,
                            }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12}
                    style={{
                        display: 'flex', 
                        alignItems: 'baseline', 
                        justifyContent: 'center', 
                        marginLeft: "auto",
                        marginTop: "10px",
                        marginRight: "auto",
                        maxWidth: window.innerWidth < 700 ? "95%" : "1000px",
                    }} container spacing={2} columns={{ xs: 2, sm: 10, md: 12 }}>
                        <Box>
                        { started
                            ?
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'right', marginTop: '10px' }}>
                                <CircularProgress />
                                </Box>
                            </>
                            :
                            <>
                                <div style={{ marginTop: "10px" }}>
                                <Button
                                onClick={submit}
                                sx={{ 
                                    textTransform: 'none', 
                                    borderRadius: '10px', 
                                    fontSize: "15px", 
                                    fontWeight: "bold",
                                    backgroundColor: "#423bff",
                                    color: "#fff",
                                    marginTop: "10px",
                                    ":hover": {
                                    backgroundColor: "#302cad",
                                    color: "#fff",
                                    borderColor: "#302cad"
                                    }
                                }}
                                variant="outlined">
                                    Create DAO Post
                                </Button>
                                </div>
                            </>
                        }
                    </Box>
                </Grid>
                { finishedCreation ?
                    <>
                        <Grid item xs={12}
                            style={{
                                display: 'flex', 
                                alignItems: 'baseline', 
                                justifyContent: 'center', 
                                marginLeft: "auto",
                                marginTop: "50px",
                                marginRight: "auto",
                                maxWidth: window.innerWidth < 700 ? "95%" : "1000px",
                            }} container spacing={2} columns={{ xs: 2, sm: 10, md: 12 }}>
                                <div>
                                    <div style={{ marginTop: "10px" }}>
                                        <Button
                                        onClick={() => window.open("https://www.tally.xyz/add-a-dao")}
                                        sx={{ 
                                            width: "200px",
                                            textTransform: 'none', 
                                            borderRadius: '10px', 
                                            fontSize: "15px", 
                                            fontWeight: "bold",
                                            backgroundColor: "#423bff",
                                            color: "#fff",
                                            marginTop: "10px",
                                            ":hover": {
                                            backgroundColor: "#222",
                                            color: "#fff",
                                            borderColor: "#222"
                                            }
                                        }}
                                        variant="outlined">
                                            Continue on tally.xyz
                                        </Button>
                                    </div>
                                    <div style={{ marginTop: "10px" }}>
                                        <div style={{
                                            width: "200px",
                                            fontSize: "12px",
                                            color: "#aaa",
                                            textAlign: "center"
                                        }}>
                                            Click "Start a Governor" on Tally
                                        </div>
                                    </div>
                                </div>
                        </Grid>
                        <Grid item xs={12}
                        style={{
                            display: 'flex', 
                            alignItems: 'baseline', 
                            justifyContent: 'center', 
                            marginLeft: "auto",
                            marginTop: "20px",
                            marginRight: "auto",
                            maxWidth: window.innerWidth < 700 ? "95%" : "1000px",
                        }} container spacing={2} columns={{ xs: 2, sm: 10, md: 12 }}>
                            <Paper elevation={0} style={{
                                width: "500px",
                                padding: "20px",
                                borderStyle: "solid",
                                borderColor: "#eee",
                                borderWidth: "1px",
                                boxShadow: "0px 1px 5px #ddd",
                            }}>
                                <div style={{
                                    width: "100%",
                                    textAlign: "center",
                                    marginTop: "5px"
                                }}>Enter this on tally.xyz when prompted: </div>
                                <div style={{
                                    width: "100%",
                                    fontWeight: "bold",
                                    marginTop: "15px"
                                }}>Governor: </div>
                                <div style={{
                                    width: "100%",
                                    marginTop: "5px"
                                }}>Governance Contract: {govAddressInfo}</div>
                                <div style={{
                                    width: "100%",
                                    marginTop: "5px"
                                }}>Network: Polygon Mainnet</div>
                                <div style={{
                                    width: "100%",
                                    marginTop: "5px"
                                }}>Type: Open Zeppelin Governor</div>
                                <div style={{
                                    width: "100%",
                                    marginTop: "5px"
                                }}>Start Block: {govBlocknumberInfo}</div>
                                <div style={{
                                    width: "100%",
                                    fontWeight: "bold",
                                    marginTop: "10px"
                                }}>Token: </div>
                                <div style={{
                                    width: "100%",
                                    marginTop: "5px"
                                }}>Token Address: {wrappedCollectAddressInfo}</div>
                                <div style={{
                                    width: "100%",
                                    marginTop: "5px"
                                }}>Token Type: ERC721</div>
                                <div style={{
                                    width: "100%",
                                    marginTop: "5px"
                                }}>Start Block: {wrappedCollectBlocknumberInfo}</div>
                                
                            </Paper>
                        </Grid>
                        <Grid item xs={12}
                            style={{
                                display: 'flex', 
                                alignItems: 'baseline', 
                                justifyContent: 'center', 
                                marginLeft: "auto",
                                marginTop: "50px",
                                marginRight: "auto",
                                maxWidth: window.innerWidth < 700 ? "95%" : "1000px",
                            }} container spacing={2} columns={{ xs: 2, sm: 10, md: 12 }}>
                                <div>
                                    <div style={{ marginTop: "10px" }}>
                                        <Button
                                        onClick={() => window.open("/p/" + profileIdInfo + "_" + pubIdInfo)}
                                        sx={{ 
                                            width: "200px",
                                            textTransform: 'none', 
                                            borderRadius: '10px', 
                                            fontSize: "15px", 
                                            fontWeight: "bold",
                                            backgroundColor: "#423bff",
                                            color: "#fff",
                                            marginTop: "10px",
                                            ":hover": {
                                            backgroundColor: "#222",
                                            color: "#fff",
                                            borderColor: "#222"
                                            }
                                        }}
                                        variant="outlined">
                                            Done with Tally
                                        </Button>
                                    </div>
                                    <div style={{ marginTop: "10px" }}>
                                        <div style={{
                                            width: "200px",
                                            fontSize: "12px",
                                            color: "#aaa",
                                            textAlign: "center"
                                        }}>
                                            Click this when you finish on Tally
                                        </div>
                                    </div>
                                </div>
                        </Grid>
                    </>
                    : <></>
                }
            </Grid>
            <div style={{ height: "20vh" }} ></div>
        </>
    )
}

export default Create;