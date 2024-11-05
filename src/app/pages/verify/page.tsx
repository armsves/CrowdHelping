"use client"
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'
import type { ISuccessResult } from "@worldcoin/idkit";
import { verify } from "../../actions/verify";

function Example() {

  // TODO: Calls your implemented server route
  const handleProof = async (result: ISuccessResult) => {
    console.log(
      "Proof received from IDKit, sending to backend:\n",
      JSON.stringify(result)
    ); // Log the proof from IDKit to the console for visibility
    const data = await verify(result);
    if (data.success) {
      console.log("Successful response from backend:\n", JSON.stringify(data)); // Log the response from our backend for visibility
    } else {
      throw new Error(`Verification failed: ${data.detail}`);
    }
  };

  // TODO: Functionality after verifying
  const onSuccess = () => {
    console.log("Success")
  };

  return (
    <div>
      <h2>Verify Yourself</h2>
      <h3>You will gain voting and posting rights when you verify yourself</h3>
      <IDKitWidget
        app_id={process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`}
        action={process.env.NEXT_PUBLIC_WLD_ACTION as string}
        //false
        verification_level={VerificationLevel.Device}
        handleVerify={handleProof}
        onSuccess={onSuccess}>
        {({ open }) => (
          <button
            onClick={open}
          >
            Verify with World ID
          </button>
        )}
      </IDKitWidget>

    </div>
  );
}

export default Example;
