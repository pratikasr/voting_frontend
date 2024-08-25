'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AlertCircle, CheckCircle, User } from 'lucide-react';

const contractABI = [
  "function vote(uint256 candidateIndex) public",
  "function getCandidateVotes(uint256 candidateIndex) public view returns (string memory, uint256)",
  "function getCandidateCount() public view returns (uint256)",
  "function hasVoted(address) public view returns (bool)"
];
const contractAddress = "0x260471fcaB62b943247BA80934FBAbee916Ae4C8";

const candidateImages = {
  "MODI": "https://www.thestatesman.com/wp-content/uploads/2022/09/03_Merged.jpg",
  "RAHUL": "https://assets.telegraphindia.com/telegraph/709081d1-2a15-4c82-9575-225fdc840791.jpg",
  "KEJRIWAL": "https://img.etimg.com/thumb/msid-76309605,width-300,height-225,imgsize-44422,resizemode-75/arvind-kejriwal.jpg"
};

export default function VotingDApp() {
  const [wallet, setWallet] = useState(null);
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          setWallet(address);

          const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contractInstance);

          const candidateCount = await contractInstance.getCandidateCount();
          const candidatesData = [];
          for (let i = 0; i < candidateCount; i++) {
            const [name, votes] = await contractInstance.getCandidateVotes(i);
            candidatesData.push({ name, votes: votes.toNumber() });
          }
          setCandidates(candidatesData);

          const voted = await contractInstance.hasVoted(address);
          setHasVoted(voted);
        } catch (error) {
          console.error("An error occurred:", error);
          setError("Failed to connect to the blockchain. Please make sure you're using a Web3-enabled browser and are connected to the correct network.");
        } finally {
          setLoading(false);
        }
      } else {
        setError("No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.");
        setLoading(false);
      }
    };

    init();
  }, []);

  const vote = async (candidateIndex) => {
    if (contract && !hasVoted) {
      try {
        setLoading(true);
        const tx = await contract.vote(candidateIndex);
        await tx.wait();
        setHasVoted(true);
        const updatedCandidates = [...candidates];
        updatedCandidates[candidateIndex].votes++;
        setCandidates(updatedCandidates);
      } catch (error) {
        console.error("Error voting:", error);
        setError("Failed to cast your vote. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-green-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <img src="/api/placeholder/100/100" alt="Indian Election Commission" className="h-12 sm:h-16 mx-auto" />
              <h1 className="text-2xl font-semibold text-center mt-4">Indian PM Election Voting</h1>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
                <AlertCircle className="mr-2" />
                <span>{error}</span>
              </div>
            )}

            {wallet ? (
              <div className="mt-4 p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded-md flex items-center">
                <User className="mr-2" />
                <span className="text-sm">Connected: {wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}</span>
              </div>
            ) : (
              <p className="mt-4 text-red-600">Please connect your wallet to vote.</p>
            )}

            {hasVoted && (
              <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md flex items-center">
                <CheckCircle className="mr-2" />
                <span>Thank you for voting!</span>
              </div>
            )}

            <div className="mt-8">
              {candidates.map((candidate, index) => (
                <div key={index} className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="md:flex">
                    <div className="md:flex-shrink-0">
                      <img className="h-48 w-full object-cover md:w-48" src={candidateImages[candidate.name] || "/api/placeholder/200/200"} alt={candidate.name} />
                    </div>
                    <div className="p-8">
                      <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{candidate.name}</div>
                      <p className="mt-2 text-gray-500">Votes: {candidate.votes}</p>
                      <button
                        onClick={() => vote(index)}
                        disabled={hasVoted || !wallet}
                        className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Vote
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}