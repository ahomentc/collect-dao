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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FilterNoneIcon from '@mui/icons-material/FilterNone';
import IconButton from '@mui/material/IconButton';

import {
    PublicationDocument, 
  } from '../LensAPI/generated.ts';

const SimplePublication = (props) => {

    const profileIdRef = useRef()
    const pubIdRef = useRef()
    const fetchedInfo = useRef(false)
    const [content, setContent] = useState()
    const [avi, setAvi] = useState(userImg)
    const [handle, setHandle] = useState()
    const [totalAmountOfCollects, setTotalAmountOfCollects] = useState()
    const [totalAmountOfComments, setTotalAmountOfComments] = useState()
    const [totalAmountOfMirrors, setTotalAmountOfMirrors] = useState()

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
                console.log(publication)
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
                if (publication && publication.stats) {
                    setTotalAmountOfCollects(publication.stats.totalAmountOfCollects)
                    setTotalAmountOfComments(publication.stats.totalAmountOfComments)
                    setTotalAmountOfMirrors(publication.stats.totalAmountOfMirrors)
                }
            }
          }
        }, 100)
      })();

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
                    <ListItem 
                        style={{ 
                            fontSize: "14px",
                        }}
                    >
                        <a 
                            onClick={(e) => {e.stopPropagation(); window.open("https://lensport.io/p/" + props.profileId + "_" + props.pubId)}}
                        >
                            <IconButton
                                style={{
                                    fontSize: "14px",
                                    marginRight: "5px",
                                    padding: "5px"
                                }}>
                                <FilterNoneIcon
                                    style={{
                                        height: "20px",
                                        width: "20px"
                                    }} 
                                />
                            </IconButton>
                        </a>
                        {totalAmountOfCollects}
                        <a 
                            onClick={(e) => {e.stopPropagation(); window.open("https://lensport.io/p/" + props.profileId + "_" + props.pubId + "/thread")}}
                        >
                            <IconButton
                                style={{
                                    fontSize: "14px",
                                    marginRight: "5px",
                                    marginLeft: "20px",
                                    padding: "5px"
                                }}>
                                <ChatBubbleOutlineIcon
                                    style={{
                                        height: "20px",
                                        width: "20px"
                                    }} 
                                />
                            </IconButton>
                        </a>
                        {totalAmountOfComments}
                        <a 
                            onClick={(e) => {e.stopPropagation();}}
                        >
                            <IconButton
                                style={{
                                    fontSize: "14px",
                                    marginRight: "5px",
                                    marginLeft: "20px",
                                    padding: "5px"
                                }}>
                                <SwapHorizIcon
                                    style={{
                                        height: "20px",
                                        width: "20px"
                                    }} 
                                />
                            </IconButton>
                        </a>
                        {totalAmountOfMirrors}
                    </ListItem>
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

export default SimplePublication;