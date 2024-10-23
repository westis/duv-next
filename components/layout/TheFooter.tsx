import React from "react";
import Link from "next/link";

export function TheFooter() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About DUV</h3>
            <p className="text-sm text-muted-foreground">
              DUV Ultramarathon Statistics provides comprehensive data and
              analysis for ultramarathon events worldwide.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm hover:underline">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:underline">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {/* Add social media icons here */}
              {/* For example: */}
              {/* <Link href="https://twitter.com/duv_ultra" target="_blank" rel="noopener noreferrer">
                <TwitterIcon className="w-6 h-6" />
              </Link> */}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} DUV Ultramarathon Statistics. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
