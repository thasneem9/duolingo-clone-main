import Image from "next/image";

import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <div className="hidden h-20 w-full border-t-2 border-slate-200 p-2 lg:block">
      <div className="mx-auto flex h-full max-w-screen-lg items-center justify-evenly">
        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <Image
            src="/abc.png"
            alt="Croatian"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          Alphabets
        </Button>

        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <Image
            src="/footer/greetings.png"
            alt="Spanish"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          GREETINGS
        </Button>

        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <Image
            src="/footer/signs.png"
            alt="French"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          Daily signs
        </Button>

        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <Image
            src="/footer/conversation.png"
            alt="Italian"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          Conversation
        </Button>

        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <Image
            src="/footer/region.png"
            alt="regions"
            height={32}
            width={40}
            className="mr-4 rounded-md"
          />
          Regional Variations
        </Button>
      </div>
    </div>
  );
};
