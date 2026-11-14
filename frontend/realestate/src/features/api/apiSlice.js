import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
    reducerPath: "api",

    baseQuery: fetchBaseQuery({
        baseUrl: "http://127.0.0.1:8000/api",
    }),

    tagTypes: ["Property", "Favorite", "User"],

    endpoints: (builder) => ({
        createProperty: builder.mutation({
    query: (data) => ({
        url: "/properties/",
        method: "POST",
        body: data,
    }),
    invalidatesTags: ["Property"],
}),

uploadPropertyPhoto: builder.mutation({
    query: ({ propertyId, image }) => {
        const formData = new FormData();
        formData.append("image", image);

        return {
            url: `/properties/${propertyId}/photos/`,
            method: "POST",
            body: formData,
        };
    },
    invalidatesTags: ["Property"],
}),
        getProperties: builder.query({
            query: () => "/properties/",
            providesTags: ["Property"],
        }),

        getProperty: builder.query({
            query: (id) => `/properties/${id}/`,
            providesTags: ["Property"],
        }),

        getFavorites: builder.query({
            query: (userId) => `/favorites/?user=${userId}`,
            providesTags: ["Favorite"],
        }),

        getUser: builder.query({
            query: (id) => `/users/${id}/`,
            providesTags: ["User"],
        }),

        updateUser: builder.mutation({
            query: ({ id, ...data }) => ({
            url: `/users/${id}/`,
            method: "PUT",
            body: data,
        }),
        invalidatesTags: ["User"],
        }),

        registerUser: builder.mutation({
            query: (data) => ({
                url: "/register/",
                method: "POST",
                body: data,
            }),
        }),

        loginUser: builder.mutation({
    query: (data) => ({
        url: "/login/",
        method: "POST",
        body: data,
    }),
}),

    addFavorite: builder.mutation({
        query: ({ user, property }) => ({
            url: "/favorites/",
            method: "POST",
            body: {
                user,
                property,
            },
        }),
        invalidatesTags: ["Favorite"],
    }),

    deleteFavorite: builder.mutation({
        query: (id) => ({
            url: `/favorites/${id}/`,
            method: "DELETE",
        }),
        invalidatesTags: ["Favorite"],
    }),
        }),
    });

    export const {
        useGetPropertiesQuery,
        useGetPropertyQuery,
        useGetFavoritesQuery,
        useAddFavoriteMutation,
        useDeleteFavoriteMutation,
        useGetUserQuery,
        useUpdateUserMutation,
        useRegisterUserMutation,
        useLoginUserMutation,
        useCreatePropertyMutation,
useUploadPropertyPhotoMutation,
    } = apiSlice;