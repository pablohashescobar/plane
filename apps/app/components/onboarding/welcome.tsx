// next
import Image from "next/image";
// icons
import Logo from "public/logo.png";

const Welcome = () => {
  return (
    <div className="mx-auto space-y-4 lg:w-2/3">
      <div className="h-1/2">
        <Image src={Logo} height={100} width={100} alt="Plane Logo" />
      </div>
      <div className="h-1/2 space-y-4">
        <h2 className="mb-4 text-2xl font-medium">Welcome to Plane</h2>
        <p className="text-sm text-gray-400">
          Plane helps you plan your issues, cycles, and product modules to ship faster.
        </p>
        <p className="text-sm text-gray-400">1/5</p>
      </div>
    </div>
  );
};

export default Welcome;
