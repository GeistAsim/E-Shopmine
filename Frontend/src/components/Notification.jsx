import React from 'react'
import { useContext } from 'react'
import { ContainerContext } from '../Context/context'
import { IoIosNotificationsOutline } from "react-icons/io";


export const Notification = () => {

    const { notification } = useContext(ContainerContext)

    return (
        <>
            <div className="notification-toast">
                <div className="notification-icon">
                    <IoIosNotificationsOutline />
                </div>
                    <div className="notification-content">
                        <div className="notification-title">{notification.status_code}</div>
                        <div className="notification-message">{notification.message}</div>
                    </div>

                {/* <button className="close-btn" aria-label="Close notification">&times;</button> */}
            </div>
        </>
    )
}
