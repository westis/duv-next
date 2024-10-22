import React, { useState, useEffect, KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { User, Calendar, MapPin, Users, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SearchResult = {
  type: "runner" | "event";
  id: string;
  name: string;
  details: string;
  gender?: string;
  activeRange?: string;
};

type SearchType = "all" | "runner" | "event";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  searchType: SearchType;
  onSearchTypeChange: (value: SearchType) => void;
  searchResults: SearchResult[];
  loading: boolean;
  totalHits: number;
}

export function SearchDialog({
  open,
  onOpenChange,
  searchTerm,
  onSearchTermChange,
  searchType,
  onSearchTypeChange,
  searchResults,
  loading,
  totalHits,
}: SearchDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();

  const runners = searchResults.filter((result) => result.type === "runner");
  const events = searchResults.filter((result) => result.type === "event");

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleResultClick(searchResults[selectedIndex]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onOpenChange(false);
    const path =
      result.type === "runner"
        ? `/runners/${result.id}`
        : `/events/${result.id}/results`;
    router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onKeyDown={handleKeyDown}>
        <VisuallyHidden>
          <DialogTitle>Search runners and events</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search runners, events..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="flex-grow"
            />
            <Select value={searchType} onValueChange={onSearchTypeChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="runner">Runners</SelectItem>
                <SelectItem value="event">Events</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {searchTerm.length >= 3 && (
            <div className="border rounded-md">
              {loading ? (
                <div className="p-2">Searching...</div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="p-2 bg-blue-50 text-blue-700 font-medium border-b dark:bg-blue-900 dark:text-blue-100">
                    Show all results ({totalHits})
                  </div>
                  {runners.length > 0 && (
                    <div>
                      <div className="p-2 font-medium bg-gray-50 border-b dark:bg-gray-800 dark:text-gray-200">
                        Runners
                      </div>
                      {runners.map((runner, index) => {
                        const [nationality, yob] = runner.details.split(", ");
                        const isSelected = index === selectedIndex;
                        return (
                          <div
                            key={runner.id}
                            onClick={() => handleResultClick(runner)}
                            className={`block p-2 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                              isSelected ? "bg-gray-100 dark:bg-gray-600" : ""
                            }`}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-500" />
                                <span className="font-medium">
                                  {runner.name}
                                </span>
                                <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                                  {nationality}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  <span>{yob}</span>
                                </div>
                                {runner.gender && (
                                  <div className="flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    <span>{runner.gender}</span>
                                  </div>
                                )}
                                {runner.activeRange && (
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    <span>{runner.activeRange}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {events.length > 0 && (
                    <div>
                      <div className="p-2 font-medium bg-gray-50 border-b dark:bg-gray-800 dark:text-gray-200">
                        Events
                      </div>
                      {events.map((event, index) => {
                        const [date, location] = event.details.split(" • ");
                        const isSelected =
                          index + runners.length === selectedIndex;
                        return (
                          <div
                            key={event.id}
                            onClick={() => handleResultClick(event)}
                            className={`block p-2 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                              isSelected ? "bg-gray-100 dark:bg-gray-600" : ""
                            }`}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                                <span className="font-medium">
                                  {event.name}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>{date}</span>
                                <span className="mx-2">•</span>
                                <span>{location}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-2">No results found.</div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
