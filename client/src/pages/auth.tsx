import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react'; // Assuming Chakra UI for toasts
import { Redirect } from 'react-router-dom'; // Assuming React Router for redirects
import { Input, Label, Button } from '@chakra-ui/react'; // Assuming Chakra UI for form elements


// Define your insertUserSchema here.  Example:
const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});


const RegistrationForm = ({ user, registerMutation, loginMutation }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(
      insertUserSchema.extend({
        email: z.string().email("Invalid email format"),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { toast } = useToast();

  useEffect(() => {
    if (loginMutation.isSuccess) {
      toast({
        title: "Success",
        description: "Logged in successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
    if (registerMutation.isSuccess) {
      toast({
        title: "Success",
        description: "Account created successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
    if (registerMutation.isError) {
      toast({
        title: "Error",
        description: registerMutation.error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [loginMutation.isSuccess, registerMutation.isSuccess, registerMutation.isError]);


  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit((data) => registerMutation.mutate(data))}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            type="email"
            {...register("email", { required: true })}
            isInvalid={errors.email}
          />
          {errors.email && <p role="alert">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-username">Username</Label>
          <Input
            id="reg-username"
            {...register("username", { required: true })}
            isInvalid={errors.username}
          />
          {errors.username && <p role="alert">{errors.username.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-password">Password</Label>
          <Input
            id="reg-password"
            type="password"
            {...register("password", { required: true })}
            isInvalid={errors.password}
          />
          {errors.password && <p role="alert">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-confirm-password">Confirm Password</Label>
          <Input
            id="reg-confirm-password"
            type="password"
            {...register("confirmPassword", { required: true })}
            isInvalid={errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p role="alert">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" colorScheme="blue">Register</Button>
      </form>
    </div>
  );
};

export default RegistrationForm;