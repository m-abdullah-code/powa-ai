import React from "react";
import { IoLocationOutline, IoGlobeOutline, IoMedkitOutline } from "react-icons/io5";

interface SpecialistProps {
    image: string;
    name: string;
    specialty: string;
    location: string;
    profileUrl: string;
}

const Specialist: React.FC<SpecialistProps> = ({ image, name, specialty, location, profileUrl }) => {
    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 w-full">
            <div className="flex items-center gap-3">
                <div className="w-17 h-17 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0 overflow-hidden border-2 border-green-100 shadow-sm">
                    <img src={image} alt={name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-gray-900 truncate">{name}</h4>
                    <div className="flex items-center gap-1 mt-0.5 text-green-600">
                        <IoMedkitOutline size={14} className="shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider">{specialty}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2.5">
                <div className="flex items-start gap-2 text-gray-500">
                    <IoLocationOutline size={16} className="mt-1 shrink-0 text-gray-400" />
                    <p className="text-sm font-medium leading-relaxed line-clamp-2">{location}</p>
                </div>
            </div>

            <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-2xl transition-all text-xs font-bold border border-gray-100 hover:border-green-100"
            >
                <IoGlobeOutline size={16} />
                View Profile
            </a>
        </div>
    );
};

export default Specialist;
