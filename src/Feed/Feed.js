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
    getGlobalDAOs
} from "../FirebaseInteractions.js"

import SimplePublication from "../Publication/SimplePublication.js";
import { borderColor } from "@mui/system";

const Feed = (props) => {

    const accountRef = useRef()
    const [daos, setDaos] = useState([])

    useEffect(() => {
        if (props.account) {
            accountRef.current = props.account
        }
    }, props.account)

    useEffect(() => {
        getGlobalDAOs((_daos) => {
            setDaos(_daos)
        })
    }, [])

    return (
        <>
            <div style={{ height: "15vh" }} ></div> {/* padding */}
            <Grid container>
                <Grid item xs={12} spacing={2} columns={{ xs: 12 }} style={{
                        display: 'flex', 
                        alignItems: 'baseline', 
                        justifyContent: 'center', 
                    }}>
                    <Button 
                    onClick={() => window.location.href = "/create"}
                    variant="outlined"     
                    style={{
                        textTransform: "none",
                        borderRadius: "10px",
                        color: "#423bff",
                        borderColor: "#423bff"
                    }}>
                        Create a DAO Post
                    </Button>
                </Grid>
                <Grid item xs={12} spacing={2} columns={{ xs: 12 }} style={{
                        display: 'flex', 
                        alignItems: 'baseline', 
                        justifyContent: 'center', 
                        marginTop: "40px"
                    }}>
                    <div style={{
                        fontSize: "16px",
                        fontWeight: "bold"
                    }}>
                        DAO posts created:
                    </div>
                </Grid>
                <Grid item xs={12} spacing={2} columns={{ xs: 12 }} style={{
                    marginTop: "5px"
                }}>
                    {daos.map((dao) => (
                        <div 
                        onClick={() => window.location.href = "/p/" + dao.profileId + "_" + dao.pubId}
                        style={{
                            cursor: "pointer",
                            marginLeft: "auto",
                            marginTop: "10px",
                            marginRight: "auto",
                            width: window.innerWidth < 400 ? "95%" : "400px",
                        }}>
                            <SimplePublication 
                                profileId={dao.profileId} 
                                pubId={dao.pubId} 
                            />
                        </div>
                    ))}
                </Grid>
            </Grid>
        </>
    )
}

export default Feed;