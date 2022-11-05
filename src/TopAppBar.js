import React, { useLayoutEffect, useEffect, useState } from "react";
import Button from '@mui/material/Button';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { makeStyles } from "@material-ui/core/styles";
import logo from "./logo.png"

function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
  const [open, setOpen] = React.useState(false);
  const [account, setAccount] = useState("");
  const [rendered, setRendered] = useState("");
  
  useEffect(() => {
    async function fetchAccount() {
      try {
        if (!provider) {
          return;
        }

        // Load the user's accounts.
        const accounts = await provider.listAccounts();
        setAccount(accounts[0]);
        setRendered(account.substring(0, 5) + "..." + account.substring(38));
      } catch (err) {
        setAccount("");
        setRendered("");
        console.error(err);
      }
    }
    fetchAccount();
  }, [provider, account, setAccount, setRendered]);

  return (
    <>
      <Button style={{backgroundColor: "#000", color: "#fff", fontSize: "12px", fontWeight: "600", marginTop: "0px", marginRight: "0px", width: "140px"}}
        onClick={() => {
          if (!provider) {
            loadWeb3Modal();
          } else {
            logoutOfWeb3Modal();
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {rendered === "" && "Connect Wallet"}
          {rendered !== "" && rendered}
        </div>
      </Button>
    </>
  );
}

const useStyles = makeStyles({
  root: {
    "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
      borderStyle: "none",
    },
    "&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
      borderStyle: "none"
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderStyle: "none"
    },
  },
  paper: {
    marginTop: "5px"
  }
});

export function TopAppBar({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
  const [account, setAccount] = useState()

  useEffect(() => {
    async function fetchAccount() {
      try {
        if (!provider) {
          return;
        }
        const accounts = await provider.listAccounts();
        setAccount(accounts[0]);
      } catch (err) {
      }
    }
    fetchAccount();
  }, [provider]);

  return (
    <>
      <Box sx={{ flexGrow: 1 }} style={{
        backgroundColor: "#fff",
      }}>
        <AppBar position="fixed" 
          sx={{ 
            backgroundColor: "#fff", 
            boxShadow: "0px 5px 13px -7px #ddd",
            borderBottomWidth: "1px", 
            borderBottomStyle: "solid", 
            borderBottomColor: "#eee",
          }}>
          <Toolbar>
           <Box sx={{ flexGrow: 0 }} />
            <a href="/" >
              <Typography
                onClick = {() => window.location.href = "/"}
                variant="h6"
                noWrap
                component="div"
                sx={{ display: { xs: 'block', sm: 'block' }, marginTop: "10px" }}
              >
                <span style={{color: "#000", cursor: "pointer"}} className="navbar-brand">
                  <img src={logo} style={{width: "30px", height: "30px", marginRight: "10px"}} />
                  <span style={{float: "right"}}>
                    <strong>
                      CollectDAO
                    </strong>
                  </span>
                </span>
              </Typography>
            </a>

            <Box sx={{ flexGrow: 1 }} />

            <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
          </Toolbar>
        </AppBar>
      </Box>
    </>
  );
}